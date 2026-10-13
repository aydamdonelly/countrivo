import { readDone, type CookieReader } from "@/server/progress";
import { getDeviceDailyRuns } from "@/server/anonymous-runs";
import type { Viewer } from "@/ui/types";

/**
 * What the viewer shot today in one game (blueprint 9.4). Signed in: the server run (ranks
 * included); guest: the done cookie (score only). `null` = no shot yet.
 */
export interface Shot {
  /** The compact score ("612", "4/6", "7 / 10"). */
  scoreLabel: string;
  /** The full display string of a server run ("Score: 612 (Gap: 424)"); absent for cookie shots. */
  scoreDisplay?: string;
  rankDaily?: number | null;
  percentile?: number | null;
  runId?: number;
  isPersonalBest?: boolean;
}

/**
 * Resolves the lockout for one game: signed in through `getTodayRun`, a guest through `cv_done.g[slug]`.
 * Used by the play route, the home card, NextDailies and the profile "Today" list.
 */
export async function resolveShot(slug: string, dateKey: string, edition: string, viewer: Viewer, cookies: CookieReader): Promise<Shot | null> {
  const run = (await getDeviceDailyRuns(dateKey, edition)).find((r) => r.gameSlug === slug);
  if (run) return { scoreLabel: run.scoreDisplay, scoreDisplay: run.scoreDisplay, rankDaily: run.rankDaily, percentile: run.percentile, runId: run.id };
  const label = readDone(cookies, dateKey, edition)[slug];
  return label ? { scoreLabel: label } : null;
}

/** Every shot of the day at once (one query signed in, the cookie for guests), keyed by slug. */
export async function resolveShots(dateKey: string, edition: string, viewer: Viewer, cookies: CookieReader): Promise<Record<string, Shot>> {
  const out: Record<string, Shot> = {};
  for (const run of await getDeviceDailyRuns(dateKey, edition)) out[run.gameSlug] = { scoreLabel: run.scoreDisplay, scoreDisplay: run.scoreDisplay, rankDaily: run.rankDaily, percentile: run.percentile, runId: run.id };
  for (const [slug, label] of Object.entries(readDone(cookies, dateKey, edition))) if (!out[slug]) out[slug] = { scoreLabel: label };
  return out;
}
