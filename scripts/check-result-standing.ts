import assert from "node:assert/strict";
import { resultLeaderboardWindow } from "../src/lib/result-leaderboard";
import type { LeaderboardEntry } from "../src/types/server";

function board(scores: readonly number[]): LeaderboardEntry[] {
  return scores.map((score, index) => ({ runId: index + 1, userId: `run-${index + 1}`, username: `QA ${index + 1}`, displayName: `QA ${index + 1}`,
    avatarUrl: null, scoreRaw: score, scoreMax: 10000, scoreSortValue: score, scoreDisplay: String(score),
    rankDaily: 1 + scores.filter(other => other > score).length, percentile: 0 }));
}

let checks = 0;
function check(value: unknown, message: string) { assert.ok(value, message); checks++; }
const small = board([100, 90, 80, 70, 60, 50]);
const original = JSON.stringify(small);
for (const own of small) {
  const window = resultLeaderboardWindow(small, own.runId, own.scoreSortValue, small.length);
  check(!window.entries.some(entry => entry.runId === own.runId), "Published own run must appear only once in the UI");
  check(window.entries.length <= 4, "Result window is bounded");
  check(!window.gapBeforeYou, "A complete board is not marked as truncated");
  check(window.entries.every(entry => entry.rank === small.find(source => source.runId === entry.runId)?.rankDaily), "Official published ranks are retained");
}
check(JSON.stringify(small) === original, "Window selection does not mutate a shared public board");
const middle = resultLeaderboardWindow(small, 999, 85, small.length);
assert.deepEqual(middle.entries.map(entry => entry.scoreSortValue), [100, 90, 80, 70]); checks++;
const ties = board([100, 90, 90, 90, 80]);
const tiedWindow = resultLeaderboardWindow(ties, 2, 90, ties.length);
assert.deepEqual(tiedWindow.entries.map(entry => entry.rank), [1, 2, 2, 5]); checks++;
const hidden = small.filter(entry => entry.runId !== 2 && entry.runId !== 4);
const blockedWindow = resultLeaderboardWindow(hidden, 999, 85, small.length);
check(!blockedWindow.entries.some(entry => entry.runId === 2 || entry.runId === 4), "Filtered publishers are never recreated");
check(blockedWindow.entries.find(entry => entry.runId === 3)?.rank === 3, "Blocking a player does not silently recalculate the official rank");

const large = board(Array.from({ length: 1000 }, (_, index) => 10000 - index));
const capped = large.slice(0, 500);
const outside = resultLeaderboardWindow(capped, 9999, 9001, large.length);
check(outside.gapBeforeYou, "An uncaptured lower score is separated by an honest omission marker");
assert.deepEqual(outside.entries.map(entry => entry.rank), [1, 2]); checks++;
const ownBelowCap = large[899];
const publishedBelowCap = resultLeaderboardWindow([...capped, ownBelowCap], ownBelowCap.runId, ownBelowCap.scoreSortValue, large.length);
check(publishedBelowCap.gapBeforeYou, "An explicitly included own row below the first500 still has an omission marker");
check(!publishedBelowCap.entries.some(entry => entry.runId === ownBelowCap.runId), "Own row below500 is not duplicated among public neighbours");
const boundary = resultLeaderboardWindow(capped, 9999, capped[499].scoreSortValue, large.length);
check(!boundary.gapBeforeYou, "A score within the loaded prefix does not acquire a false truncation marker");
check(boundary.entries.every(entry => entry.rank >= 498), "Boundary context shows the end of the loaded prefix, not rank1");
const empty = resultLeaderboardWindow([], 999, 50, 0);
check(empty.entries.length === 0 && !empty.gapBeforeYou, "Empty actual board has no fabricated players or gap");
const allBlocked = resultLeaderboardWindow([], 999, 50, 10);
check(allBlocked.entries.length === 0, "All-blocked context does not disclose hidden names");
console.log(`check-result-standing: ${checks} pure public-window, ties, blocked and500-row boundary checks passed`);
