/**
 * Which eight statistics a Blind Pick board uses. Pure, no clock, no Math.random.
 *
 * Until BLIND_PICK_ROTATION_FROM every board draws eight of the nine V3_STATS, in that exact
 * order, so a board that has not been snapshotted yet is dealt exactly as before. From that
 * Berlin date on, four familiar anchors sit on every board and four come from a rotating deck
 * of eight. The deck is shuffled once per two-day block from the date alone: the first day of
 * a block takes one half, the second day the other half. So the two days of a block share no
 * rotating statistic, none plays more than two days in a row, each plays on half of all days,
 * and an edition reroll keeps the categories and only re-deals the countries.
 */
import { mulberry32, seededShuffle } from "@/lib/seeded-random";

/** The nine statistics of every eight-country board before the rotation, frozen in their historical order. */
export const V3_STATS = [
  "population",
  "area-km2",
  "gdp-per-capita",
  "gdp",
  "life-expectancy",
  "urban-population-pct",
  "internet-users-pct",
  "fertility-rate",
  "forest-coverage-pct",
] as const;

/** On every rotation board: the four statistics most players can place without a definition. */
export const ANCHOR_STATS = ["population", "area-km2", "gdp", "life-expectancy"] as const;

/** Four of these join the anchors each day. */
export const ROTATING_STATS = [
  "gdp-per-capita",
  "urban-population-pct",
  "internet-users-pct",
  "forest-coverage-pct",
  "fertility-rate",
  "population-density",
  "latitude",
  "arable-land-pct",
] as const;

export type RotatingStat = (typeof ROTATING_STATS)[number];

/**
 * Pairs that never share a board. Population density borrows the city artwork of urban
 * population and farmland borrows the trees of forest cover until their own clay art exists,
 * so two slots never show the same picture.
 */
export const SEPARATE_PAIRS: readonly (readonly [RotatingStat, RotatingStat])[] = [
  ["urban-population-pct", "population-density"],
  ["forest-coverage-pct", "arable-land-pct"],
];

/** The first Berlin day dealt from the rotation. Earlier dates keep the V3 draw. */
export const BLIND_PICK_ROTATION_FROM = "2026-11-27";

const DAY_MS = 86_400_000;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcDay(dateKey: string): number | null {
  const m = DATE_KEY.exec(dateKey);
  if (!m) return null;
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS);
}

const FROM_DAY = utcDay(BLIND_PICK_ROTATION_FROM) ?? 0;

/** Days since BLIND_PICK_ROTATION_FROM, or null when the date is malformed or earlier. */
export function rotationDay(dateKey: string): number | null {
  const day = utcDay(dateKey);
  return day === null || day < FROM_DAY ? null : day - FROM_DAY;
}

/** Whether boards dated `dateKey` are dealt from the rotation. */
export function rotationActive(dateKey: string): boolean {
  return rotationDay(dateKey) !== null;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PAIRED: ReadonlySet<string> = new Set(SEPARATE_PAIRS.flat());

/**
 * Splits a shuffled deck into two halves of four and moves the second member of any
 * separated pair that landed beside its partner across, in exchange for an unpaired
 * statistic. The other half always holds one: it has at most two paired statistics.
 */
function separate(deck: readonly RotatingStat[]): [RotatingStat[], RotatingStat[]] {
  const half = deck.length / 2;
  const a = deck.slice(0, half);
  const b = deck.slice(half);
  for (const [x, y] of SEPARATE_PAIRS) {
    const together = a.includes(x) && a.includes(y) ? [a, b] : b.includes(x) && b.includes(y) ? [b, a] : null;
    if (!together) continue;
    const [same, other] = together;
    const j = other.findIndex((s) => !PAIRED.has(s));
    const i = same.indexOf(y);
    [same[i], other[j]] = [other[j], same[i]];
  }
  return [a, b];
}

/** The two halves of one two-day block, from the block number alone. */
export function rotationBlock(block: number): [RotatingStat[], RotatingStat[]] {
  return separate(seededShuffle([...ROTATING_STATS], mulberry32(hashString(`bp-rotation:${block}`))));
}

/** The four rotating statistics of a daily board, or null before the rotation starts. */
export function rotatingStatsForDate(dateKey: string): RotatingStat[] | null {
  const n = rotationDay(dateKey);
  if (n === null) return null;
  const [first, second] = rotationBlock(Math.floor(n / 2));
  return n % 2 === 0 ? first : second;
}

/** Four rotating statistics for a practice board, drawn from the board's own RNG. */
export function rotatingStatsForPractice(rng: () => number): RotatingStat[] {
  return separate(seededShuffle([...ROTATING_STATS], rng))[0];
}
