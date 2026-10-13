import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { Action, GameModule } from "@/games/types";
import type { Mode } from "@/ui/types";
import type { ServerGameRun } from "@/types/server";
import { replay } from "@/features/play/replay";
import { encodeRunTicket, ensureDeviceId, gameDatabase, readDeviceId, readRunTicket, type RunTicket } from "./anonymous-identity";
import { mapAnonymousRun, type AnonymousRunRow } from "./anonymous-runs";
import { getEdition } from "./edition";
import { archivedState, frozenBoardSnapshot, frozenBoardState } from "./board-snapshots";
import {resolveDailyBoard} from './daily-board-state';
import { seedRivalsForGame } from "./leaderboard-bots";

export interface SessionSeed {
  slug: string;
  mode: Mode;
  dateKey: string;
  edition: string;
  seed: number;
  startedAt: string;
  archived?: boolean;
  practiceCountry?: string;
  practiceStat?: string;
  resumeToken?: string;
}

export interface SessionResponse<V> {
  success: boolean;
  view: V;
  sessionToken: string;
  revision: number;
  run?: ServerGameRun;
  publishedName?: string | null;
  error?: string;
}

function rowTicket(row: AnonymousRunRow): RunTicket {
  return { id: row.session_id, slug: row.game_slug, mode: row.mode, dateKey: row.date_key, edition: row.edition, seed: row.seed, startedAt: row.started_at, archived: row.archived, practiceCountry: row.state_json?.practiceCountry, practiceStat: row.state_json?.practiceStat };
}

export async function prepareGameSession<S, A extends Action, V>(module: GameModule<S, A>, view: (state: S) => V, input: SessionSeed): Promise<SessionResponse<V>> {
  if(input.archived&&input.dateKey>=getTodayDateKey())throw new Error('Archived board not found');
  const daily=input.mode==='daily'?await resolveDailyBoard(module,view,input):null;
  const snapshot=input.archived?await frozenBoardSnapshot<S>(input.slug,input.dateKey,input.edition):null;
  const frozen=snapshot?.solution??null;
  if (input.archived && !frozen) throw new Error("Archived board not found");
  const created=frozen??daily?.state??module.create(input.seed,input.mode,input.dateKey);
  const seed=snapshot?.seed??daily?.seed??input.seed;
  const active=input.archived||input.mode==='daily'?{...module,create:()=>created}:module;
  const device = await readDeviceId();
  if (device && input.mode === "practice" && input.resumeToken) {
    const resumed = readRunTicket(input.resumeToken);
    if (resumed?.slug === input.slug && resumed.mode === "practice") {
      const { data } = await gameDatabase().from("countrivo_runs").select("*").eq("device_id", device).eq("session_id", resumed.id).maybeSingle<AnonymousRunRow>();
      if (data) {
        const state = replay(active, data.seed, data.mode, data.date_key, data.action_log).state;
        return {success:true,view:view(state),sessionToken:encodeRunTicket(rowTicket(data)),revision:data.revision,
          run:data.status==='complete'?await mapAnonymousRun(data):undefined,publishedName:data.display_name};
      }
    }
  }
  if (device && input.mode === "daily") {
    const { data } = await gameDatabase().from("countrivo_runs").select("*").eq("device_id", device).eq("game_slug", input.slug)
      .eq("date_key", input.dateKey).eq("edition", input.edition).eq("mode", "daily").maybeSingle<AnonymousRunRow>();
    if (data) {
      const ticket = rowTicket(data);
      const state = replay(active, ticket.seed, ticket.mode, ticket.dateKey, data.action_log).state;
      return { success: true, view: view(state), sessionToken: encodeRunTicket(ticket), revision: data.revision,
        run: data.status === "complete" ? await mapAnonymousRun(data) : undefined, publishedName: data.display_name };
    }
  }
  const ticket = { ...input, seed, id: randomUUID() };
  return { success: true, view: view(created), sessionToken: encodeRunTicket(ticket), revision: 0 };
}

export async function updateDeviceStreak(deviceId: string, dateKey: string): Promise<void> {
  const { data } = await gameDatabase().from("countrivo_runs").select("date_key").eq("device_id", deviceId).eq("mode", "daily").eq("status", "complete")
    .lte("date_key", dateKey).order("date_key", { ascending: false }).limit(1000).returns<{ date_key: string }[]>();
  const dates = new Set((data ?? []).map((r) => r.date_key));
  const cursor = new Date(`${dateKey}T12:00:00Z`);
  let count = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) { count += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  (await cookies()).set("cv_streak", JSON.stringify({ day: dateKey, count }), { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 31536000 });
}

/** Revision compare-and-swap makes every committed reveal irreversible, including concurrent tabs. */
export async function commitGameSession<S, A extends Action, V>(module: GameModule<S, A>, view: (state: S) => V,
  input: { sessionToken: string; revision: number; action: A }): Promise<SessionResponse<V>> {
  const ticket = readRunTicket(input.sessionToken);
  if (!ticket || ticket.slug !== module.slug) throw new Error("invalid_session");
  if (ticket.mode === "daily" && (ticket.dateKey !== getTodayDateKey() || ticket.edition !== await getEdition())) {
    const closed=await frozenBoardState<S>(ticket.slug,ticket.dateKey,ticket.edition);
    return { success: false, view: view(closed??module.create(ticket.seed,ticket.mode,ticket.dateKey)), sessionToken: input.sessionToken, revision: 0, error: "This daily board has closed. Play today's board." };
  }
  const dailyInitial=ticket.mode==='daily'?await resolveDailyBoard(module,view,{slug:ticket.slug,dateKey:ticket.dateKey,edition:ticket.edition,seed:ticket.seed}):null;
  const empty=()=>view(dailyInitial?.state??module.create(ticket.seed,ticket.mode,ticket.dateKey));
  const deviceId = await ensureDeviceId();
  const db = gameDatabase();
  let { data: row } = await db.from("countrivo_runs").select("*").eq("session_id", ticket.id).eq("device_id", deviceId).maybeSingle<AnonymousRunRow>();
  if (!row) {
    if (ticket.mode === "daily") await seedRivalsForGame(ticket.slug,ticket.dateKey);
    const inserted = await db.from("countrivo_runs").insert({ session_id: ticket.id, device_id: deviceId, game_slug: ticket.slug, mode: ticket.mode,
      date_key: ticket.dateKey, edition: ticket.edition, seed: ticket.seed, started_at: ticket.startedAt, archived: ticket.archived === true,
      state_json: ticket.practiceCountry || ticket.practiceStat ? {practiceCountry:ticket.practiceCountry,practiceStat:ticket.practiceStat}:null }).select("*").maybeSingle<AnonymousRunRow>();
    row = inserted.data;
    if (!row && ticket.mode === "daily") {
      const daily = await db.from("countrivo_runs").select("*").eq("device_id", deviceId).eq("game_slug", ticket.slug).eq("mode", "daily")
        .eq("date_key", ticket.dateKey).eq("edition", ticket.edition).maybeSingle<AnonymousRunRow>();
      row = daily.data;
    }
  }
  if (!row) return { success: false, view: empty(), sessionToken: input.sessionToken, revision: 0, error: "Couldn't save this move. Try again." };
  const currentTicket = rowTicket(row);
  const token = encodeRunTicket(currentTicket);
  const frozen = currentTicket.archived ? await archivedState<S>(currentTicket.slug,currentTicket.dateKey,currentTicket.edition)
    : currentTicket.mode==='daily'?await frozenBoardState<S>(currentTicket.slug,currentTicket.dateKey,currentTicket.edition):null;
  if (currentTicket.archived && !frozen) throw new Error("Archived board not found");
  const activeModule = frozen ? { ...module, create: () => frozen } : module;
  const current = replay(activeModule, currentTicket.seed, currentTicket.mode, currentTicket.dateKey, row.action_log);
  const response = async (r: AnonymousRunRow): Promise<SessionResponse<V>> => ({ success: true,
    view: view(replay(activeModule, r.seed, r.mode, r.date_key, r.action_log).state), sessionToken: token, revision: r.revision,
    run: r.status === "complete" ? await mapAnonymousRun(r) : undefined, publishedName: r.display_name });
  if (row.revision !== input.revision || row.status === "complete") return response(row);
  const encodedAction = module.codec.enc([input.action]);
  const decoded = module.codec.dec(encodedAction);
  if (decoded.length !== 1 || encodedAction.length > 128) return { success: false, view: view(current.state), sessionToken: token, revision: row.revision, error: "Choose a valid move." };
  const next = module.reduce(current.state, decoded[0]);
  if (next === current.state) return { success: false, view: view(current.state), sessionToken: token, revision: row.revision, error: "Choose a valid move." };
  const log = module.codec.enc([...current.actions, decoded[0]]);
  const finished = module.done(next);
  const payload = finished ? module.payload(next, { mode: ticket.mode, dateKey: ticket.dateKey, startedAt: ticket.startedAt }) : null;
  const update = { action_log: log, revision: row.revision + 1, status: finished ? "complete" : "open",
    ...(payload ? { score_raw: payload.scoreRaw, score_max: payload.scoreMax, score_sort_value: payload.scoreSortValue,
      score_display: payload.scoreDisplay, result_json: payload.resultJson, completed_at: new Date().toISOString() } : {}) };
  const { data: updated } = await db.from("countrivo_runs").update(update).eq("id", row.id).eq("device_id", deviceId).eq("revision", row.revision)
    .select("*").maybeSingle<AnonymousRunRow>();
  if (updated) {
    if (finished && ticket.mode === "daily") await updateDeviceStreak(deviceId, ticket.dateKey);
    return response(updated);
  }
  const { data: latest } = await db.from("countrivo_runs").select("*").eq("id", row.id).eq("device_id", deviceId).single<AnonymousRunRow>();
  return latest ? response(latest) : { success: false, view: view(current.state), sessionToken: token, revision: row.revision, error: "Connection interrupted. Try this move again." };
}
