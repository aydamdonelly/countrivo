/*
 * Stat Guesser engine (concept 5.6). Five rounds, each one country and one stat, guessed by
 * placing a pin on a ruler. Pure: no React, no Date.now(), no Math.random(). Every random
 * choice comes from the injected RNG; the daily rotation comes from the day index.
 *
 * Board plan (daily and practice share it):
 *   round 1  population                                   tier A
 *   round 2  area, GDP or GDP per person                  tier A
 *   round 3  another of those three                       tier B or C
 *   round 4  the third magnitude stat or a percentage     tier A
 *   round 5  a percentage stat (the less familiar kind)   tier B or C
 *
 * Daily rotation: each (stat, tier) pair walks a fixed, seeded permutation of its pool, one
 * step per calendar day. Every pool holds more than 60 countries, so no (country, stat) pair
 * comes back within 60 days, without any stored history. When two rounds of one day would
 * land on the same country, the later round moves to its next allowed stat, which keeps the
 * rotation intact.
 */
import { countries, categories } from "@/lib/data/public";
import statsData from "@/data/stats.json";
import sovereignData from "@/data/sovereign.json";
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32, seededShuffle } from "@/lib/seeded-random";
import {
  GUESS_STATS,
  MAGNITUDE_STATS,
  PERCENT_STATS,
  REFERENCES,
  TIER_A,
  type GuessStat,
  type MagnitudeStat,
  type PercentStat,
} from "./anchors";

export { GUESS_STATS, MAGNITUDE_STATS, PERCENT_STATS, type GuessStat } from "./anchors";

const stats: Record<string, Record<string, number | null>> = statsData;
const SOVEREIGN: readonly string[] = sovereignData;
const TIER_A_SET = new Set(TIER_A);

export const ROUNDS = 5;
/** Round 5 counts double. */
export const ROUND_WEIGHTS: readonly number[] = [1, 1, 1, 1, 2];
export const MAX_SCORE = 600;
export const PAR = 300;
/** No (country, stat) pair repeats inside this many days. */
export const ROTATION_DAYS = 60;

export type StatKind = "magnitude" | "percent";
type Tier = "A" | "B";

/** A country on the ruler: the asked one, a reference or a context pin. */
export interface SgPlace {
  iso3: string;
  iso2: string;
  name: string;
  value: number;
}

export interface StatGuesserRound {
  country: { iso3: string; iso2: string; name: string };
  stat: GuessStat;
  actualValue: number;
  /** The two fixed reference countries, lower first. */
  refs: readonly [SgPlace, SgPlace];
  /** The three sovereign states nearest the true value, shown after the lock. */
  context: readonly SgPlace[];
}

export interface StatGuesserState {
  rounds: StatGuesserRound[];
  currentRound: number;
  /** The locked value per round (a ruler step), null until locked. */
  guesses: (number | null)[];
  /** Points per round before doubling, 0 to 100, null until locked. */
  points: (number | null)[];
  phase: "playing" | "reveal" | "results";
}

export interface BoardPlan {
  mode: "daily" | "practice";
  /** Days since 1970-01-01 for the board's date key. */
  day: number;
  /** 0 on a normal day; an admin edition reroll shifts every rotation by this much. */
  shift: number;
}

// --- stat metadata ------------------------------------------------------------------------

export function isMagnitude(stat: GuessStat): stat is MagnitudeStat {
  return (MAGNITUDE_STATS as readonly string[]).includes(stat);
}

export function isPercent(stat: GuessStat): stat is PercentStat {
  return (PERCENT_STATS as readonly string[]).includes(stat);
}

export function isGuessStat(slug: string): slug is GuessStat {
  return (GUESS_STATS as readonly string[]).includes(slug);
}

export function kindOf(stat: GuessStat): StatKind {
  return isMagnitude(stat) ? "magnitude" : "percent";
}

/** The data year of a stat (`Population, 2023`). */
export function statYear(stat: GuessStat): number | null {
  return categories.find((c) => c.slug === stat)?.sourceYear ?? null;
}

/** A sovereign state's value for a stat, or null without data. */
export function valueOf(iso3: string, stat: GuessStat): number | null {
  const v = stats[iso3]?.[stat];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const COUNTRY_BY_ISO3 = new Map(countries.map((c) => [c.iso3, c]));

function place(iso3: string, stat: GuessStat): SgPlace {
  const c = COUNTRY_BY_ISO3.get(iso3);
  return { iso3, iso2: c?.iso2 ?? "", name: c?.displayName ?? iso3, value: valueOf(iso3, stat) ?? 0 };
}

/** Sovereign states with a value for the stat, sorted by ISO3 so every permutation is stable. */
const withData = new Map<GuessStat, string[]>();
function sovereignWith(stat: GuessStat): string[] {
  let list = withData.get(stat);
  if (!list) {
    list = SOVEREIGN.filter((iso3) => valueOf(iso3, stat) !== null && COUNTRY_BY_ISO3.has(iso3)).sort();
    withData.set(stat, list);
  }
  return list;
}

// --- the ruler ----------------------------------------------------------------------------

export interface Ruler {
  kind: StatKind;
  /** The ruler's ends: the sovereign minimum and maximum, or 0 and 100. */
  min: number;
  max: number;
  /** Every value the pin can rest on, ascending. */
  steps: number[];
  /** Indexes of the coarse steps: 1, 2 and 5 per decade, or every fifth point. */
  coarse: number[];
  /** The index the pin starts on: the step nearest the ruler's centre. */
  centre: number;
}

/** Fine mantissas per decade: roughly even in log space, 1, 2 and 5 among them. */
const MANTISSAS = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9];
const COARSE_MANTISSAS = new Set([1, 2, 5]);

const rulers = new Map<GuessStat, Ruler>();

export function rulerFor(stat: GuessStat): Ruler {
  const hit = rulers.get(stat);
  if (hit) return hit;
  let ruler: Ruler;
  if (isMagnitude(stat)) {
    const values = sovereignWith(stat).map((iso3) => valueOf(iso3, stat) ?? 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const steps: number[] = [];
    const coarse: number[] = [];
    for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
      for (const m of MANTISSAS) {
        const v = Number((m * Math.pow(10, e)).toPrecision(3));
        if (v < min || v > max) continue;
        if (COARSE_MANTISSAS.has(m)) coarse.push(steps.length);
        steps.push(v);
      }
    }
    ruler = { kind: "magnitude", min, max, steps, coarse, centre: 0 };
  } else {
    const steps = Array.from({ length: 101 }, (_, i) => i);
    ruler = { kind: "percent", min: 0, max: 100, steps, coarse: steps.filter((v) => v % 5 === 0), centre: 50 };
  }
  ruler.centre = nearestStep(ruler, 0.5);
  rulers.set(stat, ruler);
  return ruler;
}

/** Where a value sits on the ruler, 0 at the left end and 1 at the right. */
export function positionOf(ruler: Ruler, value: number): number {
  const t =
    ruler.kind === "magnitude"
      ? Math.log(Math.max(value, ruler.min) / ruler.min) / Math.log(ruler.max / ruler.min)
      : (value - ruler.min) / (ruler.max - ruler.min);
  return Math.min(1, Math.max(0, t));
}

/** The step index nearest a ruler position. */
export function nearestStep(ruler: Ruler, t: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < ruler.steps.length; i++) {
    const d = Math.abs(positionOf(ruler, ruler.steps[i]) - t);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** The step index holding exactly this value, or -1. */
export function stepIndexOf(ruler: Ruler, value: number): number {
  return ruler.steps.findIndex((v) => Math.abs(v - value) <= Math.abs(v) * 1e-9);
}

/** The next coarse step to the right (dir 1) or left (dir -1) of index i. */
export function coarseStep(ruler: Ruler, i: number, dir: 1 | -1): number {
  if (dir > 0) return ruler.coarse.find((c) => c > i) ?? ruler.steps.length - 1;
  for (let k = ruler.coarse.length - 1; k >= 0; k--) if (ruler.coarse[k] < i) return ruler.coarse[k];
  return 0;
}

// --- scoring ------------------------------------------------------------------------------

/**
 * Magnitude: round(100 x max(0, 1 - |log10(guess / actual)|)), so 2 times off scores 70 and
 * 10 times off scores 0 either way. Percentage: round(100 x max(0, 1 - |guess - actual| / 25)).
 */
export function pointsFor(stat: GuessStat, guess: number, actual: number): number {
  if (isMagnitude(stat)) {
    if (!(guess > 0) || !(actual > 0)) return 0;
    return Math.round(100 * Math.max(0, 1 - Math.abs(Math.log10(guess / actual))));
  }
  return Math.round(100 * Math.max(0, 1 - Math.abs(guess - actual) / 25));
}

/** The weighted total: round 5 counts double. */
export function totalOf(points: readonly (number | null)[]): number {
  return points.reduce<number>((sum, p, i) => sum + (p ?? 0) * (ROUND_WEIGHTS[i] ?? 1), 0);
}

// --- the board ----------------------------------------------------------------------------

/** Days since 1970-01-01 for a `YYYY-MM-DD` key; 0 for anything else. */
export function dayIndex(dateKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 0;
  const ms = Date.parse(`${dateKey}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : 0;
}

/**
 * The plan for a board. A daily seed is `dateSeed(dateKey + edition)`; with no edition it
 * equals `dateSeed(dateKey)` and the rotation runs unshifted. An edition reroll shifts every
 * rotation, so a rerolled day gets new countries as well as new stats.
 */
export function boardPlan(seed: number, mode: "daily" | "practice", dateKey: string): BoardPlan {
  const shift = mode === "daily" && seed !== dateSeed(dateKey) ? 1 + (seed % 997) : 0;
  return { mode, day: dayIndex(dateKey), shift };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** The pool for a (stat, tier): sovereign, with data, in the tier, never a reference for the stat. */
const pools = new Map<string, string[]>();
export function poolFor(stat: GuessStat, tier: Tier): string[] {
  const key = `${stat}|${tier}`;
  let pool = pools.get(key);
  if (!pool) {
    const refs = new Set(REFERENCES[stat]);
    pool = sovereignWith(stat).filter((iso3) => !refs.has(iso3) && TIER_A_SET.has(iso3) === (tier === "A"));
    pools.set(key, pool);
  }
  return pool;
}

/** The fixed rotation order of a (stat, tier) pool. */
const rotations = new Map<string, string[]>();
function rotationFor(stat: GuessStat, tier: Tier): string[] {
  const key = `${stat}|${tier}`;
  let order = rotations.get(key);
  if (!order) {
    order = seededShuffle(poolFor(stat, tier), mulberry32(hashString(`stat-guesser|rotation|${key}|1`)));
    rotations.set(key, order);
  }
  return order;
}

/** The country a (stat, tier) pair gives on a day. */
export function dailyPick(stat: GuessStat, tier: Tier, day: number, shift: number): string {
  const order = rotationFor(stat, tier);
  const n = order.length;
  return order[(((day + shift) % n) + n) % n];
}

/** The three sovereign states nearest the true value, never the asked country or a reference. */
function contextFor(stat: GuessStat, iso3: string): SgPlace[] {
  const actual = valueOf(iso3, stat) ?? 0;
  const skip = new Set([iso3, ...REFERENCES[stat]]);
  const gap = (v: number) => (isMagnitude(stat) ? Math.abs(Math.log(Math.max(v, 1e-9) / Math.max(actual, 1e-9))) : Math.abs(v - actual));
  return sovereignWith(stat)
    .filter((c) => !skip.has(c))
    .map((c) => ({ c, d: gap(valueOf(c, stat) ?? 0) }))
    .sort((a, b) => a.d - b.d || (a.c < b.c ? -1 : 1))
    .slice(0, 3)
    .map(({ c }) => place(c, stat));
}

function roundFor(stat: GuessStat, iso3: string): StatGuesserRound {
  const c = COUNTRY_BY_ISO3.get(iso3);
  const [lo, hi] = REFERENCES[stat];
  return {
    country: { iso3, iso2: c?.iso2 ?? "", name: c?.displayName ?? iso3 },
    stat,
    actualValue: valueOf(iso3, stat) ?? 0,
    refs: [place(lo, stat), place(hi, stat)],
    context: contextFor(stat, iso3),
  };
}

const SLOT_TIERS: readonly Tier[] = ["A", "A", "B", "A", "B"];

/** The stat candidates per slot, in preference order (see the board plan at the top). */
function slotCandidates(rng: () => number): GuessStat[][] {
  const mags = seededShuffle(["area-km2", "gdp", "gdp-per-capita"] satisfies GuessStat[], rng);
  const pcts = seededShuffle([...PERCENT_STATS] as GuessStat[], rng);
  return [
    ["population"],
    // round 2 takes the first magnitude stat that is free; round 3 the next, and so on.
    mags,
    mags,
    seededShuffle([...mags, ...pcts], rng),
    pcts,
  ];
}

/**
 * A new board. Daily: the stats come from the RNG and the countries from the rotation.
 * Practice: both from the RNG, never one of today's daily (country, stat) pairs.
 */
export function createStatGuesser(rng: () => number, plan: BoardPlan): StatGuesserState {
  const candidates = slotCandidates(rng);
  const usedStats = new Set<GuessStat>();
  const usedCountries = new Set<string>();
  const rounds: StatGuesserRound[] = [];

  for (let slot = 0; slot < ROUNDS; slot++) {
    const tier = SLOT_TIERS[slot];
    const open = candidates[slot].filter((s) => !usedStats.has(s));
    let chosen: { stat: GuessStat; iso3: string } | null = null;
    let fallback: { stat: GuessStat; iso3: string } | null = null;
    for (const stat of open) {
      let iso3: string;
      if (plan.mode === "daily") {
        iso3 = dailyPick(stat, tier, plan.day, plan.shift);
      } else {
        const today = dailyPick(stat, tier, plan.day, 0);
        const pool = poolFor(stat, tier).filter((c) => c !== today && !usedCountries.has(c));
        iso3 = pool[Math.floor(rng() * pool.length)];
      }
      if (!fallback) fallback = { stat, iso3 };
      if (!usedCountries.has(iso3)) {
        chosen = { stat, iso3 };
        break;
      }
    }
    const pick = chosen ?? fallback;
    if (!pick) throw new Error(`stat-guesser: no stat left for round ${slot + 1}`);
    usedStats.add(pick.stat);
    usedCountries.add(pick.iso3);
    rounds.push(roundFor(pick.stat, pick.iso3));
  }

  return {
    rounds,
    currentRound: 0,
    guesses: new Array<number | null>(ROUNDS).fill(null),
    points: new Array<number | null>(ROUNDS).fill(null),
    phase: "playing",
  };
}

/** Lock the pin on ruler step `step` for the current round. Anything off the ruler is ignored. */
export function lockGuess(state: StatGuesserState, step: number): StatGuesserState {
  if (state.phase !== "playing") return state;
  const round = state.rounds[state.currentRound];
  const ruler = rulerFor(round.stat);
  if (!Number.isInteger(step) || step < 0 || step >= ruler.steps.length) return state;
  const value = ruler.steps[step];
  const guesses = [...state.guesses];
  const points = [...state.points];
  guesses[state.currentRound] = value;
  points[state.currentRound] = pointsFor(round.stat, value, round.actualValue);
  return { ...state, guesses, points, phase: "reveal" };
}

/** Leave the reveal: the next round, or the result after round 5. */
export function nextRound(state: StatGuesserState): StatGuesserState {
  if (state.phase !== "reveal") return state;
  const next = state.currentRound + 1;
  if (next >= state.rounds.length) return { ...state, phase: "results" };
  return { ...state, currentRound: next, phase: "playing" };
}

/** A dossier practice round never asks a reference country or a protected daily tuple. */
export function retargetStatPractice(state: StatGuesserState, iso3: string, excludedStats: readonly string[] = []): StatGuesserState {
  if (state.phase !== "playing" || state.currentRound !== 0 || state.guesses.some((guess) => guess !== null) || !SOVEREIGN.includes(iso3)) return state;
  const allowed = (stat: GuessStat): boolean => {
    const value = valueOf(iso3, stat);
    return value !== null && Number.isFinite(value) && (isMagnitude(stat) ? value > 0 : value >= 0) && !REFERENCES[stat].includes(iso3) && !excludedStats.includes(stat);
  };
  for (let index = 0; index < state.rounds.length; index += 1) {
    const current = state.rounds[index];
    const otherStats = new Set(state.rounds.filter((_round, i) => i !== index).map((round) => round.stat));
    const stat = allowed(current.stat) ? current.stat : GUESS_STATS.find((candidate) => allowed(candidate) && !otherStats.has(candidate));
    if (!stat) continue;
    const rounds = state.rounds.map((round, i) => i === index ? roundFor(stat, iso3) : round);
    return { ...state, rounds };
  }
  return state;
}

/** A category practice board asks five distinct countries about the selected statistic. */
export function retargetStatForPractice(state: StatGuesserState, stat: GuessStat, excludedIso3: readonly string[] = []): StatGuesserState {
  if (state.phase !== "playing" || state.currentRound !== 0 || state.guesses.some((guess) => guess !== null)) return state;
  const excluded = new Set([...excludedIso3, ...REFERENCES[stat]]);
  const preferred = [...state.rounds.map((round) => round.country.iso3), ...sovereignWith(stat)];
  const selected: string[] = [];
  for (const iso3 of preferred) {
    if (excluded.has(iso3) || selected.includes(iso3) || valueOf(iso3, stat) === null) continue;
    selected.push(iso3);
    if (selected.length === ROUNDS) break;
  }
  if (selected.length !== ROUNDS) return state;
  return { ...state, rounds: selected.map((iso3) => roundFor(stat, iso3)) };
}
