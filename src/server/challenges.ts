import "server-only";

import { cache } from "react";
import { getGameBySlug } from "@/lib/data/games";
import { getTodayDateKey } from "@/lib/daily-seed";
import { challengeMatchesBoard, type ChallengeTarget } from "@/lib/challenges";
import { readDeviceId, signValue, verifyValue } from "./anonymous-identity";
import { getEdition } from "./edition";
import { getArchivedBoard } from "./board-snapshots";
import type { AnonymousRunRow } from "./anonymous-runs";

interface ChallengePayload {
  version: 1;
  slug: string;
  dateKey: string;
  edition: string;
  scoreRaw: number;
  scoreMax: number;
  scoreSortValue: number;
  scoreDisplay: string;
}

export async function challengeUrlForRun(run: AnonymousRunRow): Promise<string | undefined> {
  if (run.status !== "complete" || run.mode !== "daily" || run.archived || run.device_id !== await readDeviceId()) return undefined;
  if (!getGameBySlug(run.game_slug)?.availableModes.includes("daily") || run.score_raw === null || run.score_max === null || run.score_sort_value === null || !run.score_display) return undefined;
  const payload: ChallengePayload = { version: 1, slug: run.game_slug, dateKey: run.date_key, edition: run.edition,
    scoreRaw: Number(run.score_raw), scoreMax: Number(run.score_max), scoreSortValue: Number(run.score_sort_value), scoreDisplay: run.score_display };
  return `https://countrivo.com/challenge/${signValue(Buffer.from(JSON.stringify(payload)).toString("base64url"))}`;
}

export function readChallengeToken(token: string): ChallengeTarget | null {
  if (token.length > 1200) return null;
  try {
    const encoded = verifyValue(token);
    if (!encoded) return null;
    const value: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1
      || !("slug" in value) || typeof value.slug !== "string" || !getGameBySlug(value.slug)?.availableModes.includes("daily")
      || !("dateKey" in value) || typeof value.dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.dateKey)
      || !Number.isFinite(Date.parse(`${value.dateKey}T12:00:00Z`)) || new Date(`${value.dateKey}T12:00:00Z`).toISOString().slice(0, 10) !== value.dateKey
      || !("edition" in value) || typeof value.edition !== "string" || value.edition.length > 100
      || !("scoreRaw" in value) || typeof value.scoreRaw !== "number" || !Number.isFinite(value.scoreRaw)
      || !("scoreMax" in value) || typeof value.scoreMax !== "number" || !Number.isFinite(value.scoreMax) || value.scoreMax <= 0
      || !("scoreSortValue" in value) || typeof value.scoreSortValue !== "number" || !Number.isFinite(value.scoreSortValue)
      || !("scoreDisplay" in value) || typeof value.scoreDisplay !== "string" || value.scoreDisplay.length > 64) return null;
    return { slug: value.slug, dateKey: value.dateKey, edition: value.edition, scoreRaw: value.scoreRaw, scoreMax: value.scoreMax,
      scoreSortValue: value.scoreSortValue, scoreDisplay: value.scoreDisplay, token };
  } catch { return null; }
}

export interface ChallengeBoard {
  challenge: ChallengeTarget;
  available: boolean;
  past: boolean;
  href: string | null;
}

export const openChallenge = cache(async (token: string): Promise<ChallengeBoard | null> => {
  const challenge = readChallengeToken(token);
  const today = getTodayDateKey();
  if (!challenge || challenge.dateKey > today) return null;
  const past = challenge.dateKey < today;
  const edition = past ? (await getArchivedBoard(challenge.slug, challenge.dateKey))?.edition : await getEdition();
  const available = edition === challenge.edition;
  const query = new URLSearchParams(past ? { mode: "practice", date: challenge.dateKey, challenge: token } : { mode: "daily", challenge: token });
  return { challenge, available, past, href: available ? `/games/${challenge.slug}/play?${query}` : null };
});

/** Only attach a challenge to the exact board the server has already selected. */
export async function readPlayChallenge(token: string | undefined, board: { slug: string; dateKey: string; edition: string; mode: 'daily' | 'practice'; archived: boolean }): Promise<ChallengeTarget | undefined> {
  if (!token || (board.mode !== 'daily' && !board.archived)) return undefined;
  const match = await openChallenge(token);
  const challenge = match?.challenge;
  return match?.available && challenge && challengeMatchesBoard(challenge, board) ? challenge : undefined;
}
