import type { LeaderboardEntry, ResultLeaderboardEntry } from "@/types/server";

export function resultLeaderboardWindow(entries: readonly LeaderboardEntry[], ownId: number, ownScore: number, total: number): { entries: ResultLeaderboardEntry[]; gapBeforeYou: boolean } {
  const others = entries.filter(entry => entry.runId !== ownId);
  const insertion = others.findIndex(entry => entry.scoreSortValue <= ownScore);
  const truncated = insertion < 0 && entries.length < total;
  const start = truncated ? 0 : Math.max(0, (insertion < 0 ? others.length : insertion) - 2);
  return {
    entries: others.slice(start, start + (truncated ? 2 : 4)).map(entry => ({
      runId: entry.runId, displayName: entry.displayName, scoreDisplay: entry.scoreDisplay,
      scoreSortValue: entry.scoreSortValue, rank: entry.rankDaily,
    })),
    gapBeforeYou: truncated,
  };
}
