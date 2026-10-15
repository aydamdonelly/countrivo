import type { ServerGameRun } from "@/types/server";

/** Public score only. A challenge never carries guesses, choices, a name or a device identifier. */
export interface ChallengeTarget {
  slug: string;
  dateKey: string;
  edition: string;
  scoreRaw: number;
  scoreMax: number;
  scoreSortValue: number;
  scoreDisplay: string;
  token: string;
}

export function challengeMatchesBoard(target: ChallengeTarget, board: { slug: string; dateKey: string; edition: string }): boolean {
  return target.slug === board.slug && target.dateKey === board.dateKey && target.edition === board.edition;
}

export function compareChallenge(target: ChallengeTarget, run: Pick<ServerGameRun, "scoreSortValue">): "won" | "tied" | "lost" {
  return run.scoreSortValue > target.scoreSortValue ? "won" : run.scoreSortValue === target.scoreSortValue ? "tied" : "lost";
}

/** Keep the spoiler-free result, replacing only Countrivo's destination with the signed same-board link. */
export function challengeShareText(text: string, challengeUrl?: string): string {
  if (!challengeUrl || !/^https:\/\/countrivo\.com\/challenge\/[A-Za-z0-9_.-]+$/.test(challengeUrl)) return text;
  const result = text.split("\n").filter(line => !/^(?:https?:\/\/)?(?:www\.)?countrivo\.com(?:\/|$)/.test(line.trim())).join("\n").trimEnd();
  return `${result}\n\nCan you beat my score?\n${challengeUrl}`;
}
