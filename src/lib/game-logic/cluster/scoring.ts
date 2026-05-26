import type { ClusterState } from "./types";

export interface ClusterScore {
  scoreRaw: number; // 0..4
  scoreMax: number; // 4
  scoreDisplay: string; // e.g. "3/4"
}

const SCORE_MAX = 4;

export function clusterScore(state: ClusterState): ClusterScore {
  const misses = state.attempts.filter((a) => !a.correct).length;
  let scoreRaw: number;
  if (state.won) {
    scoreRaw = Math.max(0, SCORE_MAX - misses);
  } else {
    scoreRaw = state.solvedGroups.length;
  }
  scoreRaw = Math.min(SCORE_MAX, Math.max(0, scoreRaw));
  return {
    scoreRaw,
    scoreMax: SCORE_MAX,
    scoreDisplay: `${scoreRaw}/${SCORE_MAX}`,
  };
}
