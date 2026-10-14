import "server-only";

import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { gameDatabase, readDeviceId } from "./anonymous-identity";
import type { DailySummary, LeaderboardEntry, RunDetail, ServerGameRun } from "@/types/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getCountryByIso3 } from "@/lib/data/countries";

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
  state_json: { practiceCountry?: string; practiceStat?: string } | null;
  place_country_code: string | null;
  moderation_hidden: boolean;
}

interface PublicRow {
  id: number;
  game_slug: string;
  date_key: string;
  display_name: string;
  score_raw: number;
  score_max: number;
  score_sort_value: number;
  score_display: string;
  completed_at: string;
  place_country_code: string | null;
}

const LEADERBOARD_TAG = 'anonymous-leaderboards';

/** Server actions expire this after name publication or moderation, before reading their result. */
export function invalidateAnonymousLeaderboards():void {updateTag(LEADERBOARD_TAG);}

const readLeaderboardRows = cache(unstable_cache(async (slug:string,dateKey:string):Promise<PublicRow[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("countrivo_leaderboard").select("*")
    .eq("game_slug", slug).eq("date_key", dateKey).order("score_sort_value", { ascending: false })
    .order("completed_at", { ascending: true }).limit(500)
    .abortSignal(AbortSignal.timeout(6000)).returns<PublicRow[]>();
  if (error) throw error;
  return data??[];
}, ['anonymous-leaderboard-rows'], {revalidate:10,tags:[LEADERBOARD_TAG]}));

export async function anonymousLeaderboard(slug: string, dateKey: string, limit = 50): Promise<LeaderboardEntry[]> {
  let rows:PublicRow[];
  try {rows=await readLeaderboardRows(slug,dateKey);}catch{return[];}
  return rows.slice(0,Math.min(500,Math.max(1,limit))).map((r, i) => ({
    runId: r.id, userId: `run-${r.id}`, username: r.display_name, displayName: r.display_name, avatarUrl: null,
    scoreRaw: Number(r.score_raw), scoreMax: Number(r.score_max), scoreSortValue: Number(r.score_sort_value), scoreDisplay: r.score_display,
    countryCode: r.place_country_code ? getCountryByIso3(r.place_country_code)?.iso2 ?? null : null,
    rankDaily: 1 + rows.slice(0, i).filter((x) => Number(x.score_sort_value) > Number(r.score_sort_value)).length,
    percentile: rows.length >= 20 ? Math.round(100 * rows.filter((x) => Number(x.score_sort_value) < Number(r.score_sort_value)).length / rows.length) : 0,
  }));
}

export async function anonymousSummary(slug: string, dateKey: string): Promise<DailySummary> {
  const rows = await anonymousLeaderboard(slug, dateKey, 500);
  return { playerCount: rows.length, avgScore: rows.length ? rows.reduce((sum, r) => sum + r.scoreRaw, 0) / rows.length : 0,
    topScoreRaw: rows[0]?.scoreRaw ?? null, topScoreDisplay: rows[0]?.scoreDisplay ?? null };
}

export async function mapAnonymousRun(row: AnonymousRunRow): Promise<ServerGameRun> {
  const rows = row.mode === "daily" ? await anonymousLeaderboard(row.game_slug, row.date_key, 500) : [];
  const mine = rows.find((r) => r.runId === row.id);
  return {
    id: row.id, gameSlug: row.game_slug, mode: row.mode, dailyDate: row.mode === "daily" ? row.date_key : null,
    scoreRaw: Number(row.score_raw ?? 0), scoreMax: Number(row.score_max ?? 0), scoreDisplay: row.score_display ?? "",
    scoreSortValue: Number(row.score_sort_value ?? 0), scoreNormalized: row.score_max ? Number(row.score_raw) / Number(row.score_max) : 0,
    rankDaily: mine?.rankDaily ?? null, percentile: rows.length >= 20 ? mine?.percentile ?? null : null, isPersonalBest: false,
    resultJson: row.result_json ?? {}, completedAt: row.completed_at ?? row.started_at,
    placeCountry: row.place_country_code, moderationHidden: row.moderation_hidden,
    dailyNameCount: rows.length,
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

export async function getDeviceDailyRuns(dateKey: string, edition: string): Promise<ServerGameRun[]> {
  return Promise.all((await deviceDailyRows(dateKey, edition)).map(mapAnonymousRun));
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
  if (!row || (!row.display_name && row.device_id !== device)) return null;
  const run = await mapAnonymousRun(row);
  const maySeeAnswers = row.device_id === device || row.date_key < getTodayDateKey();
  return {runId:row.id,userId:`run-${row.id}`,username:row.display_name??"Anonymous",displayName:row.display_name??"Anonymous",avatarUrl:null,
    gameSlug:row.game_slug,dailyDate:row.date_key,scoreRaw:run.scoreRaw,scoreMax:run.scoreMax,scoreDisplay:run.scoreDisplay,scoreSortValue:run.scoreSortValue,
    rankDaily:run.rankDaily,percentile:run.percentile,resultJson:maySeeAnswers?run.resultJson:null,seed:null,completedAt:run.completedAt};
}
