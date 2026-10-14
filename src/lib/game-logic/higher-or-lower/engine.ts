/*
 * Higher or Lower (concept 5.5). One stat, one chain of countries: each call compares the
 * left card with a new right one, and after the reveal the right card becomes the next left
 * card whether the call was right or wrong.
 *
 * Daily: eleven countries, ten calls, nothing ends early. Calls 1 to 7 score 1, calls 8 to
 * 10 score 2, so the maximum is 13 (par 9). The generator walks a rank-gap ladder (call 1
 * at least 80 ranks apart, call 10 between 3 and 8) and balances the answers (higher 4 to 6
 * times, never more than 3 in a row). Pairs closer than 3% are never dealt. Ranks are over
 * sovereign states only. The stat rotates by date so the same stat never returns within 6
 * days.
 *
 * Practice: an endless sudden-death chain on any eligible stat except today's daily one.
 * The streak is the score.
 *
 * Pure: the RNG is injected, no Date.now(), no Math.random(), no React.
 */
import { categories, countries } from "@/lib/data/public";
import statsData from "@/data/stats.json";
import sovereignData from "@/data/sovereign.json";
import { mulberry32, seededShuffle } from "@/lib/seeded-random";
import { HOL_STATS, type HoLStat } from "./stats";

export type Call = "higher" | "lower";
export type HoLMode = "daily" | "practice";

export interface HoLCard {
  iso3: string;
  iso2: string;
  name: string;
  value: number;
  /** Rank among the sovereign states with a value, 1 = the largest. */
  rank: number;
}

export interface HoLGame {
  mode: HoLMode;
  stat: HoLStat;
  /** Daily: 11 cards. Practice: PRACTICE_CALLS + 1 cards. */
  chain: HoLCard[];
  /** The player's calls, oldest first. Call i compares chain[i] with chain[i + 1]. */
  calls: Call[];
}

export const DAILY_CALLS = 10;
/** Calls 1 to 7 score 1, calls 8 to 10 score 2. */
export const DOUBLE_FROM = 7;
export const DAILY_MAX = 13;
export const DAILY_PAR = 9;
/** More calls than any practice streak will reach. */
export const PRACTICE_CALLS = 120;
/** Two values closer than this share of the larger are never a pair. */
export const MIN_GAP = 0.03;

/**
 * The rank-gap ladder, one [min, max] per daily call. Call 1 is a gimme (at least 80 ranks
 * apart), call 10 is a coin flip for anyone who does not know the numbers (3 to 8 apart).
 */
export const LADDER: readonly (readonly [number, number])[] = [
  [80, 200],
  [55, 110],
  [40, 80],
  [30, 60],
  [22, 45],
  [16, 34],
  [11, 25],
  [8, 18],
  [5, 13],
  [3, 8],
];

/** Practice after the ladder runs out: close, but not always a coin flip. */
const PRACTICE_TAIL: readonly [number, number] = [3, 16];

// --- data ---------------------------------------------------------------------

const stats: Record<string, Record<string, number | null>> = statsData;
const sovereign = new Set<string>(sovereignData);

interface StatTable {
  /** Sorted by value, largest first; index + 1 is the rank. */
  cards: HoLCard[];
  source: string;
  year: number;
}

const tables = new Map<HoLStat, StatTable>();

/** The sovereign states with a value for the stat, ranked largest first. Built once. */
export function statTable(stat: HoLStat): StatTable {
  const hit = tables.get(stat);
  if (hit) return hit;
  const cat = categories.find((c) => c.slug === stat);
  const rows: Omit<HoLCard, "rank">[] = [];
  for (const c of countries) {
    if (!sovereign.has(c.iso3)) continue;
    const v = stats[c.iso3]?.[stat];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    rows.push({ iso3: c.iso3, iso2: c.iso2, name: c.displayName, value: v });
  }
  rows.sort((a, b) => b.value - a.value || a.iso3.localeCompare(b.iso3));
  const table: StatTable = {
    cards: rows.map((r, i) => ({ ...r, rank: i + 1 })),
    source: cat?.source ?? "World Bank",
    year: cat?.sourceYear ?? 2023,
  };
  tables.set(stat, table);
  return table;
}

/** Two values far enough apart to be dealt as a pair (the 3% rule). */
export function farEnough(a: number, b: number): boolean {
  const big = Math.max(Math.abs(a), Math.abs(b));
  return big > 0 && Math.abs(a - b) >= MIN_GAP * big;
}

// --- the stat rotation ----------------------------------------------------------

const EPOCH_UTC = Date.UTC(2026, 0, 1);
const BLOCK = HOL_STATS.length;
/** The same stat never returns within this many days. */
const REST_DAYS = 6;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Days since 2026-01-01 for a `YYYY-MM-DD` key, null for anything else. */
function dayIndex(dateKey: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.round((t - EPOCH_UTC) / 86_400_000);
}

/**
 * The stat order for one nine-day block. Every stat plays once per block; across the seam
 * a stat that sat at position p of the previous block may only come at position p - 2 or
 * later, so two plays of the same stat are always at least seven days apart. Filling the
 * block left to right from the stats whose earliest slot has arrived never dead-ends: at
 * slot q at least min(9, q + 3) stats are allowed and only q are used.
 */
function nextBlock(prev: readonly HoLStat[], rng: () => number): HoLStat[] {
  const earliest = new Map<HoLStat, number>();
  prev.forEach((s, p) => earliest.set(s, p - (BLOCK - REST_DAYS - 1)));
  const left = [...HOL_STATS] as HoLStat[];
  const out: HoLStat[] = [];
  for (let q = 0; q < BLOCK; q += 1) {
    const ok = left.filter((s) => (earliest.get(s) ?? 0) <= q);
    const pick = ok[Math.floor(rng() * ok.length)];
    out.push(pick);
    left.splice(left.indexOf(pick), 1);
  }
  return out;
}

/** Today's stat. Deterministic from the date alone, so an edition reroll keeps it. */
export function statForDate(dateKey: string): HoLStat {
  const n = dayIndex(dateKey);
  if (n === null || n < 0) return HOL_STATS[hashString(dateKey) % BLOCK];
  const target = Math.floor(n / BLOCK);
  let block: HoLStat[] = seededShuffle([...HOL_STATS], mulberry32(hashString("hol-rotation:0")));
  for (let b = 1; b <= target; b += 1) block = nextBlock(block, mulberry32(hashString(`hol-rotation:${b}`)));
  return block[n % BLOCK];
}

// --- the daily generator --------------------------------------------------------

/** Ten answers, higher 4 to 6 times, never more than 3 alike in a row. */
function directions(rng: () => number): Call[] {
  for (;;) {
    const out: Call[] = [];
    let run = 0;
    for (let i = 0; i < DAILY_CALLS; i += 1) {
      let d: Call = rng() < 0.5 ? "higher" : "lower";
      if (run === 3 && d === out[i - 1]) d = d === "higher" ? "lower" : "higher";
      run = i > 0 && d === out[i - 1] ? run + 1 : 1;
      out.push(d);
    }
    const highs = out.filter((d) => d === "higher").length;
    if (highs >= 4 && highs <= 6) return out;
  }
}

/** The cards that may follow `from` for one call: in the gap band, the right way, 3% apart. */
function candidates(cards: readonly HoLCard[], from: HoLCard, dir: Call, band: readonly [number, number], used: ReadonlySet<string>): HoLCard[] {
  const out: HoLCard[] = [];
  for (const c of cards) {
    if (used.has(c.iso3)) continue;
    const gap = Math.abs(c.rank - from.rank);
    if (gap < band[0] || gap > band[1]) continue;
    // Rank 1 is the largest value, so "higher" means a smaller rank number.
    if (dir === "higher" ? c.rank >= from.rank : c.rank <= from.rank) continue;
    if (!farEnough(c.value, from.value)) continue;
    out.push(c);
  }
  return out;
}

const NODE_BUDGET = 4000;

const NO_USED: ReadonlySet<string> = new Set();

/**
 * For each call i, the cards from which calls i to 10 can still be completed (ignoring
 * repeats). Built backwards in one pass per call, so the walk below only ever steps onto a
 * card with a way out and almost never backtracks, even on a crowded stat like life
 * expectancy where a 3 to 8 rank gap is rarely 3% apart.
 */
function viability(cards: readonly HoLCard[], dirs: readonly Call[]): Set<string>[] {
  const out: Set<string>[] = new Array(dirs.length + 1);
  out[dirs.length] = new Set(cards.map((c) => c.iso3));
  for (let i = dirs.length - 1; i >= 0; i -= 1) {
    const ahead = out[i + 1];
    const here = new Set<string>();
    for (const c of cards) {
      if (candidates(cards, c, dirs[i], LADDER[i], NO_USED).some((n) => ahead.has(n.iso3))) here.add(c.iso3);
    }
    out[i] = here;
  }
  return out;
}

function walk(cards: readonly HoLCard[], dirs: readonly Call[], rng: () => number): HoLCard[] | null {
  const viable = viability(cards, dirs);
  if (viable[0].size === 0) return null;
  let nodes = 0;
  const chain: HoLCard[] = [];
  const used = new Set<string>();
  const step = (i: number): boolean => {
    if (i === dirs.length) return true;
    if ((nodes += 1) > NODE_BUDGET) return false;
    const from = chain[chain.length - 1];
    const next = candidates(cards, from, dirs[i], LADDER[i], used).filter((c) => viable[i + 1].has(c.iso3));
    for (const n of seededShuffle(next, rng)) {
      chain.push(n);
      used.add(n.iso3);
      if (step(i + 1)) return true;
      chain.pop();
      used.delete(n.iso3);
    }
    return false;
  };
  for (const start of seededShuffle(cards.filter((c) => viable[0].has(c.iso3)), rng)) {
    chain.length = 0;
    used.clear();
    chain.push(start);
    used.add(start.iso3);
    if (step(0)) return chain.slice();
    if (nodes > NODE_BUDGET) return null;
  }
  return null;
}

/** The daily chain: eleven sovereign states on today's stat, ladder and balance met. */
export function dailyChain(stat: HoLStat, rng: () => number): HoLCard[] {
  const { cards } = statTable(stat);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const chain = walk(cards, directions(rng), rng);
    if (chain) return chain;
  }
  throw new Error(`higher-or-lower: no daily chain for ${stat}`);
}

// --- the practice generator -----------------------------------------------------

/** The practice chain: the ladder, then close calls forever, no country twice in 30 cards. */
export function practiceChain(stat: HoLStat, rng: () => number): HoLCard[] {
  const { cards } = statTable(stat);
  const chain: HoLCard[] = [cards[Math.floor(rng() * cards.length)]];
  let run = 0;
  let prev: Call | null = null;
  while (chain.length <= PRACTICE_CALLS) {
    const i = chain.length - 1;
    const from = chain[i];
    const recent = new Set(chain.slice(-30).map((c) => c.iso3));
    let dir: Call = rng() < 0.5 ? "higher" : "lower";
    if (run >= 3 && dir === prev) dir = dir === "higher" ? "lower" : "higher";
    const band = i < LADDER.length ? LADDER[i] : PRACTICE_TAIL;
    const flip: Call = dir === "higher" ? "lower" : "higher";
    const pool: HoLCard[] =
      [
        candidates(cards, from, dir, band, recent),
        candidates(cards, from, flip, band, recent),
        candidates(cards, from, dir, [1, 400], recent),
        candidates(cards, from, flip, [1, 400], recent),
      ].find((p) => p.length > 0) ?? [];
    if (pool.length === 0) break;
    const next: HoLCard = pool[Math.floor(rng() * pool.length)];
    const actual: Call = next.value > from.value ? "higher" : "lower";
    run = actual === prev ? run + 1 : 1;
    prev = actual;
    chain.push(next);
  }
  return chain;
}

// --- the game -------------------------------------------------------------------

export function createDaily(rng: () => number, dateKey: string): HoLGame {
  const stat = statForDate(dateKey);
  return { mode: "daily", stat, chain: dailyChain(stat, rng), calls: [] };
}

/** Any eligible stat but today's daily one, so practice never deals a (country, stat) pair from today's board. */
export function createPractice(rng: () => number, dateKey: string): HoLGame {
  const today = statForDate(dateKey);
  const pool = HOL_STATS.filter((s) => s !== today);
  const stat = pool[Math.floor(rng() * pool.length)];
  return { mode: "practice", stat, chain: practiceChain(stat, rng), calls: [] };
}

/** The right answer for call i. */
export function answerAt(g: HoLGame, i: number): Call {
  return g.chain[i + 1].value > g.chain[i].value ? "higher" : "lower";
}

export function hitAt(g: HoLGame, i: number): boolean {
  return i < g.calls.length && g.calls[i] === answerAt(g, i);
}

/** Points call i is worth on the daily. */
export function worth(i: number): number {
  return i < DOUBLE_FROM ? 1 : 2;
}

/** The daily points: 1 per right call, 2 from call 8. */
export function dailyPoints(g: HoLGame): number {
  let p = 0;
  for (let i = 0; i < g.calls.length; i += 1) if (hitAt(g, i)) p += worth(i);
  return p;
}

/** The practice streak: right calls before the first wrong one. */
export function streak(g: HoLGame): number {
  let n = 0;
  while (n < g.calls.length && hitAt(g, n)) n += 1;
  return n;
}

/** The number of calls the board deals. */
export function totalCalls(g: HoLGame): number {
  return g.mode === "daily" ? Math.min(DAILY_CALLS, g.chain.length - 1) : g.chain.length - 1;
}

export function isOver(g: HoLGame): boolean {
  if (g.calls.length >= totalCalls(g)) return true;
  if (g.mode === "practice" && g.calls.length > 0) return !hitAt(g, g.calls.length - 1);
  return false;
}

/** Make the next call. A finished game is returned unchanged. */
export function makeCall(g: HoLGame, c: Call): HoLGame {
  if (isOver(g)) return g;
  return { ...g, calls: [...g.calls, c] };
}

/** Fixed-stat practice uses the same valid comparison-chain generator as random practice. */
export function createPracticeOnStat(rng: () => number, stat: HoLStat): HoLGame {
  return { mode: "practice", stat, chain: practiceChain(stat, rng), calls: [] };
}
