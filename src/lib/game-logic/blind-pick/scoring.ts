/**
 * Golf scoring for Blind Pick (concept 5.7): the score is the sum of the six ranks minus the
 * perfect board's sum, "Perfect" at 0, "+N" otherwise. Par is a fixed +10.
 */
import type { BlindPickGame, BlindPickResult, BlindPickSwap, BlindPickTier } from "./types";

/** Par for every board, daily and practice (concept 5.7, interim daily). */
export const BLIND_PICK_PAR = 10;

/** The worst possible golf score: six placements at the bottom of a 195-state ranking. */
export const BLIND_PICK_MAX_OVER = 6 * 195;

/** "Top 10", "Top 50", "Middle" or "Bottom half" for a rank among `of` sovereign states. */
export function tierFor(rank: number, of: number): BlindPickTier {
  if (rank <= 10) return "Top 10";
  if (rank <= 50) return "Top 50";
  if (rank <= of / 2) return "Middle";
  return "Bottom half";
}

/** "Perfect" or "+6". */
export function overLabel(over: number): string {
  return over === 0 ? "Perfect" : `+${over}`;
}

/** How a placement compares with the perfect board, for the share squares. */
export type PlacementMark = "match" | "near" | "off";

/** Matches the perfect slot; within 10 ranks of its perfect rank; otherwise. */
export function placementMark(slot: number, rank: number, perfectSlot: number, perfectRank: number): PlacementMark {
  if (slot === perfectSlot) return "match";
  if (rank - perfectRank <= 10) return "near";
  return "off";
}

function permutations(n: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const walk = () => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (let j = 0; j < n; j += 1) {
      if (used[j]) continue;
      used[j] = true;
      cur.push(j);
      walk();
      cur.pop();
      used[j] = false;
    }
  };
  walk();
  return out;
}

/**
 * The perfect board closest to the player's: of every assignment with the lowest sum, the one
 * that agrees with the most of the player's placements. A player who found a different but
 * equally low board is therefore shown as perfect, square for square.
 */
export function closestPerfect(matrix: number[][], placements: readonly number[]): { perfect: number[]; sum: number } {
  let bestSum = Infinity;
  let bestMatches = -1;
  let perfect: number[] = [];
  for (const p of permutations(matrix.length)) {
    let sum = 0;
    let matches = 0;
    for (let c = 0; c < p.length; c += 1) {
      sum += matrix[c][p[c]];
      if (placements[c] === p[c]) matches += 1;
    }
    if (sum < bestSum || (sum === bestSum && matches > bestMatches)) {
      bestSum = sum;
      bestMatches = matches;
      perfect = p;
    }
  }
  return { perfect, sum: bestSum };
}

/**
 * The moves that turn the player's board into the perfect one, as cycles: a two-country cycle
 * is a swap, a longer one a rotation. Each cycle's saving is positive because the perfect
 * board is the closest one (a cycle saving nothing would have been left in place). Works from
 * the saved run alone: per country, the player's slot and rank and the perfect slot and rank.
 */
export function swapCycles(
  placements: readonly number[],
  perfect: readonly number[],
  ranks: readonly number[],
  perfectRanks: readonly number[],
): BlindPickSwap[] {
  const ownerOf = new Map<number, number>();
  placements.forEach((slot, c) => ownerOf.set(slot, c));
  const seen = new Set<number>();
  const cycles: BlindPickSwap[] = [];
  for (let start = 0; start < placements.length; start += 1) {
    if (seen.has(start) || placements[start] === perfect[start]) continue;
    const moves: BlindPickSwap["moves"] = [];
    let saved = 0;
    let c = start;
    while (!seen.has(c)) {
      seen.add(c);
      moves.push({ countryIdx: c, toSlot: perfect[c] });
      saved += ranks[c] - perfectRanks[c];
      const next = ownerOf.get(perfect[c]);
      if (next === undefined) break;
      c = next;
    }
    cycles.push({ moves, saved });
  }
  return cycles.sort((a, b) => b.saved - a.saved);
}

/** The finished board, scored. Call only when every country is placed. */
export function computeResult(state: BlindPickGame): BlindPickResult {
  const { costMatrix } = state.config;
  const placements = state.placements;
  const ranks = placements.map((slot, c) => costMatrix[c][slot]);
  const playerScore = ranks.reduce((a, b) => a + b, 0);
  const { perfect, sum } = closestPerfect(costMatrix, placements);
  const perfectRanks = perfect.map((slot, c) => costMatrix[c][slot]);
  return {
    playerScore,
    optimalScore: sum,
    over: playerScore - sum,
    placements: [...placements],
    ranks,
    perfect,
    perfectRanks,
    swaps: swapCycles(placements, perfect, ranks, perfectRanks),
  };
}
