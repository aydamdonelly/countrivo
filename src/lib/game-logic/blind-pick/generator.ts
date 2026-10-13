import { countries, categories } from "@/lib/data/loader";
import { seededPick } from "@/lib/seeded-random";
import { solveAssignment } from "@/lib/assignment-solver";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";
import { SOVEREIGN_SET, sovereignCount, sovereignRank } from "./sovereign-ranks";
import type { BlindPickConfig } from "./types";

/** Six countries, six stats (concept 5.7). */
export const BOARD_SIZE = 6;

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
 * The eligible stats and their slot wording (concept 5.7 and 5.5): at least 180 sovereign
 * entries, no caveat flag (renewables, unemployment and inflation carry one; tourism has 163
 * entries), and always "Most ..." or "Largest ...", never "best". Rank 1 is the highest value.
 */
export { STAT_WORDING, statWording } from "./display";
import { STAT_WORDING } from "./display";

const ELIGIBLE_STATS: Category[] = categories.filter(
  (c) => c.slug in STAT_WORDING && sovereignCount(c.slug) >= MIN_SOVEREIGN_ENTRIES,
);

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
  const { optimalScore, assignment } = solveAssignment(matrix);
  return { countries: picked, stats, matrix, optimalScore, optimalAssignment: assignment, greedy: greedyScore(matrix) };
}

/**
 * Deals one board from the RNG alone. Six stats are drawn from the eligible nine, then six
 * sovereign states with a number on all six (from at least three continents) are drawn in
 * arrival order, until the greedy line sits MIN_GREEDY_GAP to MAX_GREEDY_GAP above the perfect line.
 * Deterministic for one RNG stream: the daily board is the same on the server and the client.
 */
export function generateBlindPickConfig(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
): BlindPickConfig {
  let best: Candidate | null = null;

  for (let statRound = 0; statRound < 12; statRound += 1) {
    const stats = seededPick(ELIGIBLE_STATS, BOARD_SIZE, rng);
    const pool = SOVEREIGN_COUNTRIES.filter((c) => stats.every((s) => sovereignRank(c.iso3, s.slug) !== null));
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const picked = seededPick(pool, BOARD_SIZE, rng);
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
