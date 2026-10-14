/*
 * Flag Quiz engine (concept 5.4). Pure: no React, no clock, the RNG is injected.
 *
 * Ten flags of sovereign states, four names each, easy to hard:
 *   flags 1 to 3   a well-known flag (KNOWN). The three distractors are well-known too, every
 *                  option comes from a different subregion, and the answer is never the one
 *                  option that sits far from the other three.
 *   flags 4 to 7   any other sovereign state. The distractors come from its subregion
 *                  (topped up from the nearest states of its region when the subregion is
 *                  too small).
 *   flags 8 to 10  a lookalike family (LOOKALIKES): the answer is one core member, the other
 *                  options are its look-alikes. These count double.
 * Flags 1 to 7 score 1, flags 8 to 10 score 2: 13 at most, par 9.
 *
 * Daily answers come from the stateless rotation (rotation.ts), so they depend on the date
 * alone; the board seed decides the distractors and the option order. Practice draws at
 * random and never uses today's daily answers or today's lookalike families.
 */
import { centroids, countries } from "@/lib/data/public";
import sovereignData from "@/data/sovereign.json";
import type { Country } from "@/types/country";
import { FAMILY_SOURCE, KNOWN, LOOKALIKES, type LookalikeSet } from "./pools";
import { dayIndex, passOf, rotationFor, type RotationSpec } from "./rotation";

export type QuestionKind = "known" | "region" | "lookalike";

export interface FlagFamily {
  /** "Chad's blue is darker than Romania's." */
  line: string;
  /** "Source: CIA World Factbook" */
  source: string;
}

export interface FlagQuizQuestion {
  /** The answer. */
  country: Country;
  /** Four names in seeded order. */
  options: Country[];
  correctIndex: number;
  kind: QuestionKind;
  /** 1 for flags 1 to 7, 2 for flags 8 to 10. */
  points: number;
  /** The lookalike family line, shown on the reveal; null outside flags 8 to 10. */
  family: FlagFamily | null;
}

export interface FlagQuizState {
  questions: FlagQuizQuestion[];
  currentQuestion: number;
  /** The picked option per flag, null until answered. */
  answers: (number | null)[];
  /** Points, not flags: 13 at most. */
  score: number;
  phase: "playing" | "results";
}

export const FLAG_COUNT = 10;
export const OPTION_COUNT = 4;
/** Flags at this index and after count double (flags 8 to 10). */
export const DOUBLE_FROM = 7;
export const MAX_POINTS = DOUBLE_FROM + (FLAG_COUNT - DOUBLE_FROM) * 2;
export const PAR = 9;

const KNOWN_PER_DAY = 3;
const REGION_PER_DAY = 4;
const LOOKALIKE_PER_DAY = 3;

/** The points a flag at index `i` is worth. */
export function pointsAt(i: number): number {
  return i >= DOUBLE_FROM ? 2 : 1;
}

// ── pools ────────────────────────────────────────────────────────────────────

const BY_ISO3 = new Map<string, Country>(countries.map((c) => [c.iso3, c]));
const SOVEREIGN: readonly string[] = (sovereignData as string[]).filter((iso3) => BY_ISO3.has(iso3));
const SOVEREIGN_SET = new Set(SOVEREIGN);
const CORE = new Set(LOOKALIKES.flatMap((s) => s.core));
const KNOWN_SET = new Set(KNOWN);
/** Flags 4 to 7: every sovereign state that is neither well-known nor a lookalike core member. */
export const REST: readonly string[] = SOVEREIGN.filter((iso3) => !KNOWN_SET.has(iso3) && !CORE.has(iso3));

const KNOWN_SPEC: RotationSpec = { salt: "known", size: KNOWN.length, perDay: KNOWN_PER_DAY, gapDays: 21 };
const REST_SPEC: RotationSpec = { salt: "rest", size: REST.length, perDay: REGION_PER_DAY, gapDays: 21 };
const LOOK_SPEC: RotationSpec = { salt: "look", size: LOOKALIKES.length, perDay: LOOKALIKE_PER_DAY, gapDays: 3 };

function country(iso3: string): Country {
  const c = BY_ISO3.get(iso3);
  if (!c) throw new Error(`flag-quiz: unknown country ${iso3}`);
  return c;
}

// ── geometry ─────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;

/** Great-circle distance in km between two countries' centroids (0 when one is missing). */
function km(a: string, b: string): number {
  const p = centroids[a];
  const q = centroids[b];
  if (!p || !q) return 0;
  const dLat = (q[0] - p[0]) * RAD;
  const dLng = (q[1] - p[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p[0] * RAD) * Math.cos(q[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Mean distance from each option to the other three. */
function meanDistances(iso3s: readonly string[]): number[] {
  return iso3s.map((a) => {
    let sum = 0;
    for (const b of iso3s) if (b !== a) sum += km(a, b);
    return sum / Math.max(1, iso3s.length - 1);
  });
}

/** True when the answer (index 0) is the one option clearly far from the rest. */
export function answerIsFarOdd(iso3s: readonly string[]): boolean {
  const d = meanDistances(iso3s);
  const others = d.slice(1);
  return d[0] > Math.max(...others);
}

// ── rng helpers (local, so the call order is fixed by this file alone) ─────────

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── the day's answers ────────────────────────────────────────────────────────

export interface DayPlan {
  known: string[];
  region: string[];
  /** One entry per lookalike flag: the family and the member that is the answer. */
  lookalikes: { set: LookalikeSet; answer: string }[];
}

/** The daily answers for a date key (null for a key that is not a date). Depends on the date only. */
export function dailyPlan(dateKey: string): DayPlan | null {
  const day = dayIndex(dateKey);
  if (day === null) return null;
  const known = rotationFor(KNOWN_SPEC, day).map((i) => KNOWN[i]);
  const region = rotationFor(REST_SPEC, day).map((i) => REST[i]);
  const lookalikes = rotationFor(LOOK_SPEC, day).map((setIndex, slot) => {
    const set = LOOKALIKES[setIndex];
    // Each time the family comes round, the next core member is the answer.
    const turn = passOf(LOOK_SPEC, day, slot) + setIndex;
    return { set, answer: set.core[turn % set.core.length] };
  });
  return { known, region, lookalikes };
}

/** A random plan for practice that stays off today's daily answers and families. */
function practicePlan(rng: () => number, today: DayPlan | null): DayPlan {
  const usedIso = new Set<string>(today ? [...today.known, ...today.region, ...today.lookalikes.map((l) => l.answer)] : []);
  const usedSets = new Set<string>(today ? today.lookalikes.map((l) => l.set.id) : []);
  const known = shuffled(KNOWN.filter((c) => !usedIso.has(c)), rng).slice(0, KNOWN_PER_DAY);
  const region = shuffled(REST.filter((c) => !usedIso.has(c)), rng).slice(0, REGION_PER_DAY);
  const sets = shuffled(LOOKALIKES.filter((s) => !usedSets.has(s.id)), rng).slice(0, LOOKALIKE_PER_DAY);
  const lookalikes = sets.map((set) => ({ set, answer: set.core[Math.floor(rng() * set.core.length)] }));
  return { known, region, lookalikes };
}

// ── distractors ──────────────────────────────────────────────────────────────

/**
 * Flags 1 to 3: three well-known distractors, all four options from four different
 * subregions, and the answer never the far odd one out. Tries up to 200 seeded draws and
 * keeps the first that passes; `avoid` (the day's other answers and family members) is soft.
 */
function knownDistractors(answer: string, rng: () => number, avoid: ReadonlySet<string>): string[] {
  const pool = KNOWN.filter((c) => c !== answer);
  const preferred = pool.filter((c) => !avoid.has(c));
  let fallback: string[] | null = null;
  // A far-flung answer (Chile, Argentina) passes on only a few draws in ten, so draw often.
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = shuffled(attempt < 150 ? preferred : pool, rng);
    const subs = new Set<string>([country(answer).subregion]);
    const picked: string[] = [];
    for (const c of order) {
      const sub = country(c).subregion;
      if (subs.has(sub)) continue;
      subs.add(sub);
      picked.push(c);
      if (picked.length === OPTION_COUNT - 1) break;
    }
    if (picked.length < OPTION_COUNT - 1) continue;
    if (!fallback) fallback = picked;
    if (!answerIsFarOdd([answer, ...picked])) return picked;
  }
  if (fallback) return fallback;
  return shuffled(pool, rng).slice(0, OPTION_COUNT - 1);
}

/**
 * Flags 4 to 7: distractors from the answer's subregion. A subregion with fewer than three
 * other sovereign states is topped up with the nearest states of the same region, then the
 * nearest anywhere. `avoid` is soft: it only reorders within a tier.
 */
function regionDistractors(answer: string, rng: () => number, avoid: ReadonlySet<string>): string[] {
  return regionRanked(answer, rng, avoid).slice(0, OPTION_COUNT - 1);
}

/** Every other sovereign state, nearest kind first: the subregion, then the region, then the world. */
function regionRanked(answer: string, rng: () => number, avoid: ReadonlySet<string>): string[] {
  const a = country(answer);
  const others = SOVEREIGN.filter((c) => c !== answer);
  const sameSub = others.filter((c) => country(c).subregion === a.subregion);
  const tierSub = [...shuffled(sameSub.filter((c) => !avoid.has(c)), rng), ...shuffled(sameSub.filter((c) => avoid.has(c)), rng)];
  const byDistance = (xs: string[]) => [...xs].sort((x, y) => km(answer, x) - km(answer, y) || (x < y ? -1 : 1));
  const sameRegion = others.filter((c) => country(c).subregion !== a.subregion && country(c).region === a.region);
  const rest = others.filter((c) => country(c).region !== a.region);
  return [...tierSub, ...byDistance(sameRegion), ...byDistance(rest)];
}

/**
 * Flags 8 to 10: the family's other members, core first, trimmed or topped up to three. A
 * kin flag that is another answer on the same board is left out, so no flag is both.
 */
function lookalikeDistractors(set: LookalikeSet, answer: string, rng: () => number, dayAnswers: ReadonlySet<string>): string[] {
  const core = shuffled(set.core.filter((c) => c !== answer), rng);
  const kin = shuffled(set.kin.filter((c) => !dayAnswers.has(c)), rng);
  const picked = [...core, ...kin].slice(0, OPTION_COUNT - 1);
  if (picked.length < OPTION_COUNT - 1) {
    for (const c of regionRanked(answer, rng, dayAnswers)) {
      if (picked.length === OPTION_COUNT - 1) break;
      if (!picked.includes(c) && !dayAnswers.has(c)) picked.push(c);
    }
  }
  return picked;
}

function question(answer: string, distractors: string[], kind: QuestionKind, points: number, family: FlagFamily | null, rng: () => number): FlagQuizQuestion {
  const options = shuffled([answer, ...distractors], rng).map(country);
  return { country: country(answer), options, correctIndex: options.findIndex((c) => c.iso3 === answer), kind, points, family };
}

// ── the board ────────────────────────────────────────────────────────────────

export interface FlagQuizSetup {
  mode: "daily" | "practice";
  /** Berlin `YYYY-MM-DD`. Daily answers come from it; practice uses it to stay off today's. */
  dateKey: string;
}

export function createFlagQuiz(rng: () => number, setup: FlagQuizSetup): FlagQuizState {
  const today = dailyPlan(setup.dateKey);
  const plan = setup.mode === "daily" && today ? today : practicePlan(rng, today);

  const answers = [...plan.known, ...plan.region, ...plan.lookalikes.map((l) => l.answer)];
  const dayAnswers = new Set(answers);
  const familyMembers = plan.lookalikes.flatMap((l) => [...l.set.core, ...l.set.kin]);
  const avoid = new Set<string>([...answers, ...familyMembers]);

  const questions: FlagQuizQuestion[] = [];
  for (const a of plan.known) questions.push(question(a, knownDistractors(a, rng, avoid), "known", pointsAt(questions.length), null, rng));
  for (const a of plan.region) questions.push(question(a, regionDistractors(a, rng, avoid), "region", pointsAt(questions.length), null, rng));
  for (const { set, answer } of plan.lookalikes) {
    questions.push(question(answer, lookalikeDistractors(set, answer, rng, dayAnswers), "lookalike", pointsAt(questions.length), { line: set.line, source: FAMILY_SOURCE }, rng));
  }

  return {
    questions,
    currentQuestion: 0,
    answers: new Array<number | null>(questions.length).fill(null),
    score: 0,
    phase: "playing",
  };
}

export function answerQuestion(state: FlagQuizState, optionIndex: number): FlagQuizState {
  if (state.phase !== "playing") return state;
  const q = state.questions[state.currentQuestion];
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= q.options.length) return state;

  const answers = [...state.answers];
  answers[state.currentQuestion] = optionIndex;
  const score = state.score + (optionIndex === q.correctIndex ? q.points : 0);
  const next = state.currentQuestion + 1;
  const complete = next >= state.questions.length;

  return {
    ...state,
    answers,
    score,
    currentQuestion: complete ? state.currentQuestion : next,
    phase: complete ? "results" : "playing",
  };
}

/** Which flags were named right, in board order. */
export function hits(state: FlagQuizState): boolean[] {
  return state.questions.map((q, i) => state.answers[i] === q.correctIndex);
}

/** Points from a hit list: 1 each for flags 1 to 7, 2 each for flags 8 to 10. */
export function pointsFromHits(h: readonly boolean[]): number {
  return h.reduce((sum, ok, i) => sum + (ok ? pointsAt(i) : 0), 0);
}

/** For tests: whether an iso3 is a sovereign state the quiz may use. */
export function isSovereign(iso3: string): boolean {
  return SOVEREIGN_SET.has(iso3);
}
