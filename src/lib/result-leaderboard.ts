import type { LeaderboardEntry, ResultLeaderboardEntry } from "@/types/server";

/** How many of the top places a result screen lists before it skips to your neighbours. */
export const RESULT_BOARD_TOP = 50;
/** Neighbours shown on each side of your place when it lies below the top block. */
const NEIGHBOURS = 3;

function toResultEntry(entry: LeaderboardEntry, gapBefore = false): ResultLeaderboardEntry {
  return {
    runId: entry.runId, displayName: entry.displayName, scoreDisplay: entry.scoreDisplay,
    scoreSortValue: entry.scoreSortValue, rank: entry.rankDaily, countryCode: entry.countryCode ?? null,
    ...(gapBefore ? { gapBefore: true } : {}),
  };
}

/**
 * The rows a daily result lists around your score (25 November 2026: the board is the focus of
 * the result, a scrollable list). The top 50 other players, then, when your place lies further
 * down, an omission marker and three players either side of it. `gapBeforeYou` marks a score
 * below the loaded prefix of the public board, where your own neighbours are unknown.
 */
export function resultLeaderboardWindow(entries: readonly LeaderboardEntry[], ownId: number, ownScore: number, total: number): { entries: ResultLeaderboardEntry[]; gapBeforeYou: boolean } {
  const others = entries.filter(entry => entry.runId !== ownId);
  const insertion = others.findIndex(entry => entry.scoreSortValue <= ownScore);
  const truncated = insertion < 0 && entries.length < total;
  const at = insertion < 0 ? others.length : insertion;
  if (truncated) return { entries: others.slice(0, RESULT_BOARD_TOP).map(entry => toResultEntry(entry)), gapBeforeYou: true };
  // Your place is within reach of the top block: one unbroken list down to three rows below you.
  if (at - NEIGHBOURS <= RESULT_BOARD_TOP) return { entries: others.slice(0, Math.max(RESULT_BOARD_TOP, at + NEIGHBOURS)).map(entry => toResultEntry(entry)), gapBeforeYou: false };
  const top = others.slice(0, RESULT_BOARD_TOP);
  const near = others.slice(at - NEIGHBOURS, at + NEIGHBOURS).map((entry, index) => toResultEntry(entry, index === 0));
  return { entries: [...top.map(entry => toResultEntry(entry)), ...near], gapBeforeYou: false };
}
