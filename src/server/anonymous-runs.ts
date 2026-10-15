import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_cache, updateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { gameDatabase, readDeviceId, verifyValue } from "./anonymous-identity";
import type { DailySummary, LeaderboardEntry, RunDetail, ServerGameRun } from "@/types/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getArchivedBoard } from "./board-snapshots";
import { getEdition } from "./edition";
import { challengeUrlForRun } from "./challenges";

export interface AnonymousRunRow {
  id: number;
  session_id: string;
  device_id: string;
  game_slug: string;
  mode: "daily" | "practice";
  date_key: string;
  edition: string;
  seed: number;
  status: "open" | "complete";
  action_log: string;
  revision: number;
  score_raw: number | null;
  score_max: number | null;
  score_sort_value: number | null;
  score_display: string | null;
  result_json: Record<string, unknown> | null;
  display_name: string | null;
  started_at: string;
  completed_at: string | null;
  archived: boolean;
  state_json: { practiceCountry?: string; practiceStat?: string; practiceRegion?: string; contentVersion?: number } | null;
  place_country_code: string | null;
  moderation_hidden: boolean;
}

interface PublicRow {
  id: number;
  display_name: string;
  score_raw: number;
  score_max: number;
  score_sort_value: number;
  score_display: string;
  completed_at: string;
  place_country_code: string | null;
  rank_daily: number;
  percentile: number;
}

interface CountryAverage { code: string; count: number; average: number; rank: number }
interface RankedBoard { count: number; average: number; entries: PublicRow[]; countries: CountryAverage[] }
export interface AnonymousBoard {
  entries: LeaderboardEntry[];
  playerCount: number;
  averageScore: number;
  countries: CountryAverage[];
  available: boolean;
}

const LEADERBOARD_TAG = "anonymous-leaderboards";
export function invalidateAnonymousLeaderboards(): void { updateTag(LEADERBOARD_TAG); }
const emptyBoard = (): RankedBoard => ({ count: 0, average: 0, entries: [], countries: [] });

const readLeaderboardRows = cache(unstable_cache(async (slug: string, dateKey: string, edition: string, ownRunId: number | null): Promise<RankedBoard> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Leaderboard unavailable");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("countrivo_ranked_board", { p_slug: slug, p_day: dateKey, p_edition: edition, p_limit: 500, p_run_id: ownRunId })
    .abortSignal(AbortSignal.timeout(6000)).returns<RankedBoard>();
  if (!error && data && "entries" in data) return data;
  if (error?.code !== "PGRST202" && error?.code !== "42883") throw error ?? new Error("Leaderboard unavailable");
  // A deployment may briefly overlap a schema rollout. Keep real scores visible, scoped to one edition.
  const fallback = await db.from("countrivo_leaderboard").select("*", { count: "exact" })
    .eq("game_slug", slug).eq("date_key", dateKey).eq("edition", edition)
    .order("score_sort_value", { ascending: false }).order("completed_at", { ascending: true }).order("id")
    .limit(500).abortSignal(AbortSignal.timeout(6000)).returns<Omit<PublicRow, "rank_daily" | "percentile">[]>();
  if (fallback.error) throw fallback.error;
  const rows = fallback.data ?? [], total = fallback.count ?? rows.length;
  return { count: total, average: 0, countries: [], entries: rows.map((row, index) => ({ ...row,
    rank_daily: index > 0 && rows[index - 1].score_sort_value === row.score_sort_value
      ? 1 + rows.findIndex(other => other.score_sort_value === row.score_sort_value) : index + 1,
    percentile: total === rows.length ? Math.round(100 * rows.filter(other => other.score_sort_value < row.score_sort_value).length / total) : 0,
  })) };
}, ["anonymous-ranked-board-v2"], { revalidate: 10, tags: [LEADERBOARD_TAG] }));

const leaderboardEdition = cache(async (slug: string, dateKey: string): Promise<string | null> =>
  dateKey === getTodayDateKey() ? getEdition() : (await getArchivedBoard(slug, dateKey))?.edition ?? null);

export async function anonymousBoard(slug: string, dateKey: string, options: { edition?: string; ownRunId?: number } = {}): Promise<AnonymousBoard> {
  try {
    const edition = options.edition ?? await leaderboardEdition(slug, dateKey);
    const board = edition ? await readLeaderboardRows(slug, dateKey, edition, options.ownRunId ?? null) : emptyBoard();
    return { available: true, playerCount: Number(board.count), averageScore: Number(board.average), countries: board.countries,
      entries: board.entries.map(row => ({
        runId: row.id, userId: `run-${row.id}`, username: row.display_name, displayName: row.display_name, avatarUrl: null,
        scoreRaw: Number(row.score_raw), scoreMax: Number(row.score_max), scoreSortValue: Number(row.score_sort_value), scoreDisplay: row.score_display,
        countryCode: row.place_country_code ? getCountryByIso3(row.place_country_code)?.iso2 ?? null : null,
        rankDaily: Number(row.rank_daily), percentile: Number(board.count) >= 20 ? Number(row.percentile) : 0,
      })) };
  } catch { return { entries: [], playerCount: 0, averageScore: 0, countries: [], available: false }; }
}

export async function anonymousLeaderboard(slug: string, dateKey: string, limit = 50): Promise<LeaderboardEntry[]> {
  return (await anonymousBoard(slug, dateKey)).entries.slice(0, Math.min(500, Math.max(1, limit)));
}

export async function anonymousSummary(slug: string, dateKey: string): Promise<DailySummary> {
  const board = await anonymousBoard(slug, dateKey);
  return { playerCount: board.playerCount, avgScore: board.averageScore,
    topScoreRaw: board.entries[0]?.scoreRaw ?? null, topScoreDisplay: board.entries[0]?.scoreDisplay ?? null };
}

/** The public scores share a cache; device-specific hidden publishers never do. */
export const blockedLeaderboardRuns = cache(async (slug: string, dateKey: string, edition: string): Promise<{ ids: number[]; enabled: boolean }> => {
  const flag = (await cookies()).get("cv_blocks")?.value;
  if (!flag || verifyValue(flag) !== "enabled") return { ids: [], enabled: false };
  const device = await readDeviceId();
  if (!device) return { ids: [], enabled: false };
  const { data, error } = await gameDatabase().rpc("countrivo_blocked_names", { p_viewer: device, p_slug: slug, p_day: dateKey, p_edition: edition })
    .abortSignal(AbortSignal.timeout(6000)).returns<{ run_id: number }[]>();
  if (error) throw new Error("Your blocked-player settings could not be opened. Try again.");
  return { ids: (Array.isArray(data) ? data : []).map(row => row.run_id), enabled: true };
});

export interface RunProjectionOptions { includeLeaderboard?: boolean; includeChallenge?: boolean }

export async function mapAnonymousRun(row: AnonymousRunRow, options: RunProjectionOptions = {}): Promise<ServerGameRun> {
  let board = options.includeLeaderboard !== false && row.mode === "daily" ? await anonymousBoard(row.game_slug, row.date_key, { edition: row.edition }) : null;
  if (board && row.display_name && !row.moderation_hidden && !board.entries.some(entry => entry.runId === row.id)) {
    board = await anonymousBoard(row.game_slug, row.date_key, { edition: row.edition, ownRunId: row.id });
  }
  const mine = board?.entries.find(entry => entry.runId === row.id);
  return {
    challengeUrl: options.includeChallenge === false ? undefined : await challengeUrlForRun(row),
    id: row.id, gameSlug: row.game_slug, mode: row.mode, dailyDate: row.mode === "daily" ? row.date_key : null,
    scoreRaw: Number(row.score_raw ?? 0), scoreMax: Number(row.score_max ?? 0), scoreDisplay: row.score_display ?? "",
    scoreSortValue: Number(row.score_sort_value ?? 0), scoreNormalized: row.score_max ? Number(row.score_raw) / Number(row.score_max) : 0,
    rankDaily: mine?.rankDaily ?? null, percentile: board && board.playerCount >= 20 ? mine?.percentile ?? null : null, isPersonalBest: false,
    resultJson: row.result_json ?? {}, completedAt: row.completed_at ?? row.started_at,
    placeCountry: row.place_country_code, moderationHidden: row.moderation_hidden, dailyNameCount: board?.available ? board.playerCount : undefined,
  };
}

const readDeviceDailyRows=cache(async (id:string,dateKey:string,edition:string):Promise<AnonymousRunRow[]>=>{
  try {
    const { data } = await gameDatabase().from("countrivo_runs").select("*").eq("device_id", id)
      .eq("date_key", dateKey).eq("edition", edition).eq("mode", "daily")
      .abortSignal(AbortSignal.timeout(6000))
      .returns<AnonymousRunRow[]>();
    return data ?? [];
  } catch {
    return [];
  }
});

/** Private rows are deduplicated only inside this React request, never shared across devices. */
export async function deviceDailySessionRows(dateKey:string,edition:string):Promise<AnonymousRunRow[]> {
  const id=await readDeviceId();
  return id?readDeviceDailyRows(id,dateKey,edition):[];
}

export async function deviceDailyRows(dateKey: string, edition: string): Promise<AnonymousRunRow[]> {
  return (await deviceDailySessionRows(dateKey,edition)).filter(row=>row.status==='complete');
}

export async function getDeviceDailyRuns(dateKey: string, edition: string, options: RunProjectionOptions = {}): Promise<ServerGameRun[]> {
  return Promise.all((await deviceDailyRows(dateKey, edition)).map(row => mapAnonymousRun(row, options)));
}

export interface DeviceOpenRun { game_slug: string; revision: number; started_at: string }

/** Home only needs status, never the private seed or answers from a live session. */
export async function deviceOpenRows(dateKey:string,edition:string):Promise<DeviceOpenRun[]> {
  return (await deviceDailySessionRows(dateKey,edition)).filter(row=>row.status==='open'&&row.revision>0)
    .map(({game_slug,revision,started_at})=>({game_slug,revision,started_at}));
}

export async function anonymousRunDetail(runId: number): Promise<RunDetail | null> {
  if (!Number.isSafeInteger(runId) || runId < 1) return null;
  const device = await readDeviceId();
  const { data: row } = await gameDatabase().from("countrivo_runs").select("*").eq("id", runId).eq("mode", "daily")
    .eq("status", "complete").maybeSingle<AnonymousRunRow>();
  if (!row || ((!row.display_name || row.moderation_hidden) && row.device_id !== device)) return null;
  const run = await mapAnonymousRun(row);
  const maySeeAnswers = row.device_id === device || row.date_key < getTodayDateKey();
  return {runId:row.id,userId:`run-${row.id}`,username:row.display_name??"Anonymous",displayName:row.display_name??"Anonymous",avatarUrl:null,
    gameSlug:row.game_slug,dailyDate:row.date_key,scoreRaw:run.scoreRaw,scoreMax:run.scoreMax,scoreDisplay:run.scoreDisplay,scoreSortValue:run.scoreSortValue,
    rankDaily:run.rankDaily,percentile:run.percentile,resultJson:maySeeAnswers?run.resultJson:null,seed:null,completedAt:run.completedAt};
}
