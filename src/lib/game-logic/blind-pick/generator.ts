import { countries, categories } from "@/lib/data/public";
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import { closestPerfect } from "./scoring";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";
import { SOVEREIGN_SET, sovereignCount, sovereignRank } from "./sovereign-ranks";
import type { BlindPickConfig } from "./types";
import { ANCHOR_STATS, V3_STATS, rotatingStatsForDate, rotatingStatsForPractice, rotationActive } from "./rotation";

export const BOARD_SIZE = 8;
export const LEGACY_BOARD_SIZE = 6;
export type BlindPickBoardSize = typeof BOARD_SIZE | typeof LEGACY_BOARD_SIZE;

/** A board is dealt only when the greedy line lands at least this far above the perfect one (concept 5.7). */
export const MIN_GREEDY_GAP = 8;

/**
 * ...and at most this far. Uncapped, the greedy line sits a median 74 ranks over perfect,
 * which leaves the fixed par of +10 out of reach for almost everyone; inside 8 to 24 the
 * greedy line lands near par, so thinking ahead is what beats it.
 */
export const MAX_GREEDY_GAP = 24;

/** Stats need at least this many sovereign entries (concept 5.7). */
export const MIN_SOVEREIGN_ENTRIES = 180;

/**
 * The slot wording (concept 5.7 and 5.5): always "Most ..." or "Largest ...", never "best".
 * Rank 1 is the highest value.
 */
export { STAT_WORDING, statWording } from "./display";

/**
 * Which statistics a board draws from. "v3" is the frozen nine-statistic draw that every
 * eight-country board used before the rotation; "rotation" deals the four anchors plus four
 * rotating statistics from BLIND_PICK_ROTATION_FROM on and falls back to the V3 draw before it.
 */
export type BlindPickPool = "v3" | "rotation";

const CATEGORY_BY_SLUG: ReadonlyMap<string, Category> = new Map(categories.map((c) => [c.slug, c]));

function statCategory(slug: string): Category {
  const category = CATEGORY_BY_SLUG.get(slug);
  if (!category) throw new Error(`blind-pick: unknown statistic ${slug}`);
  return category;
}

/**
 * The historical eligible nine (at least 180 sovereign entries, no caveat flag: renewables,
 * unemployment and inflation carry one; tourism has 163 entries), frozen as an explicit list in
 * the order they were drawn from, so new categories can never re-deal an old seed.
 */
const V3_POOL: Category[] = V3_STATS.map(statCategory).filter((c) => sovereignCount(c.slug) >= MIN_SOVEREIGN_ENTRIES);
const ANCHORS: Category[] = ANCHOR_STATS.map(statCategory);

const SOVEREIGN_COUNTRIES: Country[] = countries.filter((c) => SOVEREIGN_SET.has(c.iso3));

/** The sum a player reaches by putting each arriving country on its best free stat (ties: leftmost slot). */
export function greedyScore(matrix: number[][]): number {
  const used = new Set<number>();
  let total = 0;
  for (const row of matrix) {
    let best = -1;
    for (let j = 0; j < row.length; j += 1) {
      if (used.has(j)) continue;
      if (best < 0 || row[j] < row[best]) best = j;
    }
    used.add(best);
    total += row[best];
  }
  return total;
}

/** How far a greedy gap sits outside the window; anything under the floor ranks behind any overshoot. */
function gapMiss(gap: number): number {
  if (gap < MIN_GREEDY_GAP) return 1000 + MIN_GREEDY_GAP - gap;
  if (gap > MAX_GREEDY_GAP) return gap - MAX_GREEDY_GAP;
  return 0;
}

interface Candidate {
  countries: Country[];
  stats: Category[];
  matrix: number[][];
  optimalScore: number;
  optimalAssignment: number[];
  greedy: number;
}

function candidate(stats: Category[], picked: Country[]): Candidate {
  const matrix = picked.map((c) => stats.map((s) => sovereignRank(c.iso3, s.slug) ?? sovereignCount(s.slug)));
  const { sum, perfect } = closestPerfect(matrix, []);
  return { countries: picked, stats, matrix, optimalScore: sum, optimalAssignment: perfect, greedy: greedyScore(matrix) };
}

/**
 * Deals one board from the RNG and the date alone. Stats are drawn first (see BlindPickPool),
 * then unique sovereign states with a number on every stat (from at least three continents) are
 * drawn in arrival order, until the greedy line sits MIN_GREEDY_GAP to MAX_GREEDY_GAP above the
 * perfect line. Deterministic for one RNG stream: the daily board is the same on the server and
 * the client. A rotation daily keeps its statistics for the date and only shuffles their slots.
 */
export function generateBlindPickConfig(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
  boardSize: BlindPickBoardSize = BOARD_SIZE,
  pool: BlindPickPool = "rotation",
): BlindPickConfig {
  let best: Candidate | null = null;
  const rotation = pool === "rotation" && boardSize === BOARD_SIZE && rotationActive(dateKey);
  const dailyStats = rotation && mode === "daily" ? rotatingStatsForDate(dateKey) : null;

  for (let statRound = 0; statRound < 12; statRound += 1) {
    const stats = rotation
      ? seededShuffle([...ANCHORS, ...(dailyStats ?? rotatingStatsForPractice(rng)).map(statCategory)], rng)
      : seededPick(V3_POOL, boardSize, rng);
    const pool = SOVEREIGN_COUNTRIES.filter((c) => stats.every((s) => sovereignRank(c.iso3, s.slug) !== null));
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const picked = seededPick(pool, boardSize, rng);
      if (new Set(picked.map((c) => c.continent)).size < 3) continue;
      const cand = candidate(stats, picked);
      const miss = gapMiss(cand.greedy - cand.optimalScore);
      if (miss === 0) return toConfig(cand, mode, dateKey);
      if (!best || miss < gapMiss(best.greedy - best.optimalScore)) best = cand;
    }
  }

  if (!best) throw new Error("blind-pick: no board could be dealt");
  return toConfig(best, mode, dateKey);
}

function toConfig(c: Candidate, mode: "daily" | "practice", dateKey: string): BlindPickConfig {
  return {
    version: c.countries.length === LEGACY_BOARD_SIZE ? 2 : 3,
    countries: c.countries,
    categories: c.stats,
    costMatrix: c.matrix,
    of: c.stats.map((s) => sovereignCount(s.slug)),
    optimalScore: c.optimalScore,
    optimalAssignment: c.optimalAssignment,
    greedyScore: c.greedy,
    mode,
    dateKey,
  };
}
