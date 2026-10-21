"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { getGameBySlug } from "@/lib/data/games";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getEdition } from "@/server/edition";
import { createRunTicket, ensureDeviceId, gameDatabase, readDeviceId, readRunTicket, signValue } from "@/server/anonymous-identity";
import { anonymousLeaderboard, invalidateAnonymousLeaderboards, mapAnonymousRun, type AnonymousRunRow } from "@/server/anonymous-runs";
import { replaySubmission } from "@/server/replay-submission";
import type { ServerGameRun } from "@/types/server";
import { dailyNetworkHash } from "@/server/abuse-identity";
import { countries, sovereignIso3 } from "@/lib/data/loader";

export async function beginPracticeRun(slug: string) {
  if (!getGameBySlug(slug)?.availableModes.includes("practice")) throw new Error("Unknown practice game");
  await ensureDeviceId();
  const seed = randomInt(0, 2147483647);
  const startedAt = new Date().toISOString();
  const dateKey = getTodayDateKey();
  const edition = await getEdition();
  return { seed, startedAt, ticket: createRunTicket({ slug, mode: "practice", dateKey, edition, seed, startedAt }) };
}

export interface AnonymousSubmitResult {
  success: boolean;
  run?: ServerGameRun;
  publishedName?: string | null;
  error?: string;
}

export async function submitAnonymousRun(input: { ticket: string; log: string; timedActions?: unknown[] }): Promise<AnonymousSubmitResult> {
  try {
    const ticket = readRunTicket(input.ticket);
    if (!ticket || !getGameBySlug(ticket.slug)) return { success: false, error: "invalid_session" };
    if (ticket.slug !== "speed-flags" || ticket.mode !== "practice") return { success: false, error: "server_session_required" };
    if (Date.now() - Date.parse(ticket.startedAt) < 1500) return { success: false, error: "too_fast" };
    const deviceId = await ensureDeviceId();
    const db = gameDatabase();
    const { data: existing } = await db.from("countrivo_runs").select("*").eq("session_id", ticket.id).eq("device_id", deviceId).maybeSingle<AnonymousRunRow>();
    if (existing?.status === "complete") return { success: true, run: await mapAnonymousRun(existing), publishedName: existing.display_name };
    const payload = replaySubmission(ticket, input.log, input.timedActions);
    if (![payload.scoreRaw, payload.scoreMax, payload.scoreSortValue].every(Number.isFinite)) return { success: false, error: "invalid_result" };
    const row = {
      session_id: ticket.id, device_id: deviceId, game_slug: ticket.slug, mode: ticket.mode, date_key: ticket.dateKey,
      edition: ticket.edition, seed: ticket.seed, status: "complete", action_log: input.log,
      score_raw: payload.scoreRaw, score_max: payload.scoreMax, score_sort_value: payload.scoreSortValue,
      score_display: payload.scoreDisplay, result_json: payload.resultJson, started_at: ticket.startedAt, completed_at: new Date().toISOString(),
    };
    const { data, error } = await db.from("countrivo_runs").insert(row).select("*").single<AnonymousRunRow>();
    if (error || !data) return { success: false, error: "save_unavailable" };
    return { success: true, run: await mapAnonymousRun(data), publishedName: null };
  } catch {
    return { success: false, error: "save_unavailable" };
  }
}

export async function publishAnonymousRun(runId: number, name: string, placeCountry?: string | null): Promise<AnonymousSubmitResult> {
  const clean = name.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 20 || !/^[\p{L}\p{N} ._'’-]+$/u.test(clean)) return { success: false, error: "Use 2 to 20 letters, numbers or spaces." };
  const compact = clean.toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
  if (/https?|www|admin|moderator|countrivo|fuck|shit|nigger|nazi/i.test(compact)) return { success: false, error: "Choose a different name." };
  if (placeCountry && !sovereignIso3.includes(placeCountry)) return {success:false,error:"Choose a country from the list."};
  try {
    const deviceId = await readDeviceId();
    if (!deviceId || !Number.isSafeInteger(runId)) return { success: false, error: "This result belongs to a different browser." };
    const db = gameDatabase();
    const { data, error } = await db.rpc("countrivo_publish_name", {p_run_id:runId,p_device:deviceId,p_ip:await dailyNetworkHash(),p_day:getTodayDateKey(),p_edition:await getEdition(),p_name:clean,p_place:placeCountry||null}).returns<AnonymousRunRow[]>();
    if(error) {
      const reason=error.message;
      return {success:false,error:reason.includes("publisher_banned")?"This browser cannot publish names. Contact countrivo@gmail.com to appeal.":reason.includes("board_closed")?"This daily board has closed.":reason.includes("network_throttled")?"Too many names from this network today. Try again tomorrow.":reason.includes("name_throttled")?"You’ve changed your name often. Try again in an hour.":"Could not publish. Try again."};
    }
    const row=Array.isArray(data)?data[0]:undefined;
    if(row)invalidateAnonymousLeaderboards();
    return row?{success:true,run:await mapAnonymousRun(row),publishedName:row.display_name}:{success:false,error:"Finish today’s game first."};
  } catch {
    return { success: false, error: "Could not publish. Try again." };
  }
}

export async function getAnonymousLeaderboard(slug: string, dateKey: string) {
  return anonymousLeaderboard(slug, dateKey);
}

export async function refreshResultStanding(runId: number): Promise<ServerGameRun | null> {
  if (!Number.isSafeInteger(runId) || runId < 1) return null;
  const device = await readDeviceId();
  if (!device) return null;
  const { data, error } = await gameDatabase().from("countrivo_runs").select("*")
    .eq("id", runId).eq("device_id", device).eq("status", "complete")
    .abortSignal(AbortSignal.timeout(6000)).maybeSingle<AnonymousRunRow>();
  return !error && data ? mapAnonymousRun(data) : null;
}

export async function getLeaderboardPlaces():Promise<{iso3:string;name:string}[]> {
  return countries.filter(c=>sovereignIso3.includes(c.iso3)).map(c=>({iso3:c.iso3,name:c.displayName})).sort((a,b)=>a.name.localeCompare(b.name));
}

export async function withdrawLeaderboardName(runId: number): Promise<{ success: boolean; run?: ServerGameRun; error?: string }> {
  try {
    const device = await readDeviceId();
    if (!device || !Number.isSafeInteger(runId)) return { success: false, error: "This result belongs to a different browser." };
    const { data, error } = await gameDatabase().from("countrivo_runs").update({ display_name: null, published_at: null })
      .eq("id", runId).eq("device_id", device).eq("date_key", getTodayDateKey()).eq("edition", await getEdition()).eq("mode", "daily").select("*").maybeSingle<AnonymousRunRow>();
    if(!error&&data)invalidateAnonymousLeaderboards();
    return !error && data ? { success: true, run: await mapAnonymousRun(data) } : { success: false, error: "Could not remove your name. Try again." };
  } catch { return { success: false, error: "Could not remove your name. Try again." }; }
}

export async function reportLeaderboardName(runId: number, reason: string): Promise<{ success: boolean; error?: string }> {
  if (!Number.isSafeInteger(runId) || typeof reason !== "string" || reason.trim().length < 3 || reason.length > 120) return { success: false, error: "Choose a reason for the report." };
  try {
    const device = await ensureDeviceId();
    const { data: run } = await gameDatabase().from("countrivo_runs").select("id").eq("id", runId).not("display_name", "is", null).maybeSingle();
    if (!run) return { success: false, error: "This name is no longer on the board." };
    const {error}=await gameDatabase().rpc("countrivo_report_name",{p_run_id:runId,p_device:device,p_ip:await dailyNetworkHash(),p_reason:reason.trim()});
    if(!error)invalidateAnonymousLeaderboards();
    return error?{success:false,error:error.message.includes("report_throttled")?"Too many reports from this network. Try again tomorrow.":"Could not send this report. Try again."}:{success:true};
  } catch { return { success: false, error: "Could not send this report. Try again." }; }
}


export async function blockLeaderboardPublisher(runId: number): Promise<{ success: boolean; error?: string }> {
  if (!Number.isSafeInteger(runId) || runId < 1) return { success: false, error: "Choose a published player." };
  try {
    const device = await ensureDeviceId();
    const { error } = await gameDatabase().rpc("countrivo_block_publisher", { p_run_id: runId, p_viewer: device });
    if (error) return { success: false, error: error.message.includes("block_limit") ? "Your blocked-player list is full." : "Could not block this player. Try again." };
    (await cookies()).set("cv_blocks", signValue("enabled"), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 2 });
    return { success: true };
  } catch { return { success: false, error: "Could not block this player. Try again." }; }
}

export async function unblockLeaderboardPublishers(): Promise<{ success: boolean; error?: string }> {
  try {
    const device = await readDeviceId();
    if (!device) return { success: false, error: "Open this page in your original browser." };
    const { error } = await gameDatabase().from("countrivo_publisher_blocks").delete().eq("viewer_id", device);
    if (error) return { success: false, error: "Could not update your blocked players. Try again." };
    (await cookies()).delete("cv_blocks");
    return { success: true };
  } catch { return { success: false, error: "Could not update your blocked players. Try again." }; }
}

export async function forgetThisDevice(): Promise<void> {
  const device = await readDeviceId();
  if (device) {
    const { error } = await gameDatabase().rpc("countrivo_forget_device", { p_device_id: device });
    if (error) throw new Error("Could not clear your saved results. Try again.");
    invalidateAnonymousLeaderboards();
  }
  const jar = await cookies();
  for (const cookie of jar.getAll()) if (cookie.name.startsWith("cv_") || cookie.name.startsWith("sb-")) jar.delete(cookie.name);
}
