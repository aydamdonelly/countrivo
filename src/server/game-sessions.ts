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
import { activityFromDates, readActivity, withCompletedDay } from '@/lib/daily-activity';

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
  practiceRegion?: string;
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
  return { id: row.session_id, slug: row.game_slug, mode: row.mode, dateKey: row.date_key, edition: row.edition, seed: row.seed, startedAt: row.started_at, archived: row.archived, practiceCountry: row.state_json?.practiceCountry, practiceStat: row.state_json?.practiceStat, practiceRegion: row.state_json?.practiceRegion,
    cursor: row.status === 'open' && row.action_log.length <= 512 ? {deviceId:row.device_id,revision:row.revision,actionLog:row.action_log} : undefined };
}

export async function prepareGameSession<S, A extends Action, V>(module: GameModule<S, A>, view: (state: S) => V, input: SessionSeed, knownRun?:AnonymousRunRow|null): Promise<SessionResponse<V>> {
  if(input.archived&&input.dateKey>=getTodayDateKey())throw new Error('Archived board not found');
  const prior = async ():Promise<AnonymousRunRow|null> => {
    if(knownRun!==undefined)return knownRun;
    const device = await readDeviceId();
    if(!device)return null;
    const resumed=input.mode==='practice'&&input.resumeToken?readRunTicket(input.resumeToken):null;
    if(input.mode==='practice'&&resumed?.slug===input.slug&&resumed.mode==='practice') {
      const {data}=await gameDatabase().from('countrivo_runs').select('*').eq('device_id',device).eq('session_id',resumed.id).maybeSingle<AnonymousRunRow>();
      return data;
    }
    if(input.mode==='daily') {
      const {data}=await gameDatabase().from('countrivo_runs').select('*').eq('device_id',device).eq('game_slug',input.slug)
        .eq('date_key',input.dateKey).eq('edition',input.edition).eq('mode','daily').maybeSingle<AnonymousRunRow>();
      return data;
    }
    return null;
  };
  const [daily,snapshot,saved]=await Promise.all([
    input.mode==='daily'?resolveDailyBoard(module,view,input):null,
    input.archived?frozenBoardSnapshot<S>(input.slug,input.dateKey,input.edition):null,
    prior(),
  ]);
  const frozen=snapshot?.solution??null;
  if (input.archived && !frozen) throw new Error("Archived board not found");
  const created=frozen??daily?.state??module.create(input.seed,input.mode,input.dateKey);
  const seed=snapshot?.seed??daily?.seed??input.seed;
  const active=input.archived||input.mode==='daily'?{...module,create:()=>created}:module;
  if(saved) {
    const ticket=rowTicket(saved);
    const state=replay(active,ticket.seed,ticket.mode,ticket.dateKey,saved.action_log).state;
    return {success:true,view:view(state),sessionToken:encodeRunTicket(ticket),revision:saved.revision,
      run:saved.status==='complete'?await mapAnonymousRun(saved):undefined,publishedName:saved.display_name};
  }
  const ticket = { ...input, seed, id: randomUUID() };
  return { success: true, view: view(created), sessionToken: encodeRunTicket(ticket), revision: 0 };
}

export async function updateDeviceStreak(deviceId: string, dateKey: string): Promise<void> {
  const store = await cookies();
  const previous = readActivity(store.get('cv_activity')?.value, dateKey);
  // A second game on the same day adds no day to the habit and needs no history query.
  if (previous.days.includes(dateKey)) return;
  const { data, error } = await gameDatabase().from("countrivo_runs").select("date_key").eq("device_id", deviceId).eq("mode", "daily").eq("status", "complete")
    .lte("date_key", dateKey).order("date_key", { ascending: false }).limit(4000).abortSignal(AbortSignal.timeout(6000)).returns<{ date_key: string }[]>();
  const fallback = withCompletedDay(previous, dateKey);
  const activity = error ? fallback : activityFromDates([...(data ?? []).map(row => row.date_key), dateKey], dateKey, previous.best);
  activity.current = Math.max(activity.current, fallback.current);
  activity.best = Math.max(activity.best, activity.current);
  activity.played = Math.max(activity.played, fallback.played);
  const options = { path: '/', sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 31536000 };
  store.set('cv_activity', JSON.stringify(activity), options);
  store.set('cv_streak', JSON.stringify({ day: dateKey, count: activity.current }), options);
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
  const db = gameDatabase();
  const [dailyInitial,deviceId]=await Promise.all([
    ticket.mode==='daily'?resolveDailyBoard(module,view,{slug:ticket.slug,dateKey:ticket.dateKey,edition:ticket.edition,seed:ticket.seed}):null,
    ensureDeviceId(),
  ]);
  const empty=()=>view(dailyInitial?.state??module.create(ticket.seed,ticket.mode,ticket.dateKey));
  const initial = ticket.archived ? await archivedState<S>(ticket.slug,ticket.dateKey,ticket.edition) : dailyInitial?.state ?? null;
  if (ticket.archived && !initial) throw new Error("Archived board not found");
  const activeModule = initial ? { ...module, create: () => initial } : module;
  const response = async (r: AnonymousRunRow,state?:S): Promise<SessionResponse<V>> => ({ success: true,
    view: view(state??replay(activeModule, r.seed, r.mode, r.date_key, r.action_log).state), sessionToken: encodeRunTicket(rowTicket(r)), revision: r.revision,
    run: r.status === "complete" ? await mapAnonymousRun(r) : undefined, publishedName: r.display_name });
  const committedResponse = async (r:AnonymousRunRow,state:S):Promise<SessionResponse<V>> => {
    if(r.status!=='complete'||r.mode!=='daily')return response(r,state);
    const [result]=await Promise.all([response(r,state),updateDeviceStreak(deviceId,r.date_key)]);
    return result;
  };
  const plan = (current: ReturnType<typeof replay<S,A>>, currentTicket:RunTicket, revision:number) => {
    let decoded:A[],encodedAction:string;
    try {encodedAction=module.codec.enc([input.action]);decoded=module.codec.dec(encodedAction);} catch {return null;}
    if(decoded.length!==1||encodedAction.length>128)return null;
    const next=module.reduce(current.state,decoded[0]);
    if(next===current.state)return null;
    const finished=module.done(next);
    const payload=finished?module.payload(next,{mode:currentTicket.mode,dateKey:currentTicket.dateKey,startedAt:currentTicket.startedAt}):null;
    return {next,finished,update:{action_log:module.codec.enc([...current.actions,decoded[0]]),revision:revision+1,status:finished?'complete':'open',
      ...(payload?{score_raw:payload.scoreRaw,score_max:payload.scoreMax,score_sort_value:payload.scoreSortValue,score_display:payload.scoreDisplay,
        result_json:payload.resultJson,completed_at:new Date().toISOString()}: {})}};
  };
  const persist = async (currentTicket:RunTicket,revision:number,move:NonNullable<ReturnType<typeof plan>>) => {
    const {data}=await db.from('countrivo_runs').update(move.update).eq('session_id',currentTicket.id).eq('device_id',deviceId)
      .eq('revision',revision).eq('status','open').select('*').maybeSingle<AnonymousRunRow>();
    return data;
  };
  const cursor=ticket.cursor;
  if(!cursor&&input.revision===0) {
    const move=plan(replay(activeModule,ticket.seed,ticket.mode,ticket.dateKey,''),ticket,0);
    if(move) {
      // Unique session and daily-device constraints make the first committed move atomic as well.
      const {data:inserted}=await db.from('countrivo_runs').insert({session_id:ticket.id,device_id:deviceId,game_slug:ticket.slug,mode:ticket.mode,
        date_key:ticket.dateKey,edition:ticket.edition,seed:ticket.seed,started_at:ticket.startedAt,archived:ticket.archived===true,
        state_json:ticket.practiceCountry||ticket.practiceStat||ticket.practiceRegion?{practiceCountry:ticket.practiceCountry,practiceStat:ticket.practiceStat,practiceRegion:ticket.practiceRegion}:null,
        ...move.update}).select('*').maybeSingle<AnonymousRunRow>();
      if(inserted) {
        return committedResponse(inserted,move.next);
      }
    }
  }
  let attempted=false;
  if(cursor?.deviceId===deviceId&&cursor.revision===input.revision) {
    const current=replay(activeModule,ticket.seed,ticket.mode,ticket.dateKey,cursor.actionLog);
    const move=plan(current,ticket,cursor.revision);
    if(move) {
      attempted=true;
      // The encrypted cursor removes the read, never the compare-and-swap. Only its stored result reveals an answer.
      const updated=await persist(ticket,cursor.revision,move);
      if(updated)return committedResponse(updated,move.next);
    }
  }
  const {data:saved}=await db.from('countrivo_runs').select('*').eq('session_id',ticket.id).eq('device_id',deviceId).maybeSingle<AnonymousRunRow>();
  let row=saved;
  if (!row) {
    const inserted = await db.from("countrivo_runs").insert({ session_id: ticket.id, device_id: deviceId, game_slug: ticket.slug, mode: ticket.mode,
      date_key: ticket.dateKey, edition: ticket.edition, seed: ticket.seed, started_at: ticket.startedAt, archived: ticket.archived === true,
      state_json: ticket.practiceCountry || ticket.practiceStat || ticket.practiceRegion ? {practiceCountry:ticket.practiceCountry,practiceStat:ticket.practiceStat,practiceRegion:ticket.practiceRegion}:null }).select("*").maybeSingle<AnonymousRunRow>();
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
  const current = replay(activeModule, currentTicket.seed, currentTicket.mode, currentTicket.dateKey, row.action_log);
  if (row.revision !== input.revision || row.status === "complete") return response(row);
  if(attempted)return {success:false,view:view(current.state),sessionToken:token,revision:row.revision,error:'Connection interrupted. Try this move again.'};
  const move=plan(current,currentTicket,row.revision);
  if(!move)return {success:false,view:view(current.state),sessionToken:token,revision:row.revision,error:'Choose a valid move.'};
  const updated=await persist(currentTicket,row.revision,move);
  if(updated)return committedResponse(updated,move.next);
  const { data: latest } = await db.from("countrivo_runs").select("*").eq("id", row.id).eq("device_id", deviceId).single<AnonymousRunRow>();
  return latest && (latest.revision!==row.revision||latest.status==='complete') ? response(latest)
    : { success: false, view: view(current.state), sessionToken: token, revision: row.revision, error: "Connection interrupted. Try this move again." };
}
