"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { commitBlindSession, startBlindPractice } from "@/app/actions/blind-session";
import { computeResult, overLabel, placementMark, swapCycles } from "@/lib/game-logic/blind-pick/scoring";
import { canUndo, isComplete } from "@/lib/game-logic/blind-pick/display";
import { buildBlindPickShareText } from "@/lib/share";
import { trackCompletedRun, trackPlay } from "@/lib/play-events";
import { writeDone } from "@/features/play/persist";
import { NavigationLink } from "@/ui/navigation-link";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { ResultPanel, runRank } from "@/ui/result-panel";
import { ChallengeResult } from "@/ui/challenge-result";
import { dailyProgress } from '@/features/play/daily-progress';
import { DailyHabit } from "@/ui/daily-habit";
import { ResultFollowup, ResultFeedback } from "@/features/play/result-followup";
import type { HostProps } from "@/games/types";
import type { ServerGameRun } from "@/types/server";
import type { BlindPickAction, BlindPickState } from "./module";
import { Board, type BoardMoveFeedback } from "./board";
import { Result } from "./result";

export function BlindPickHost(p: HostProps) {
  if (!p.blindPickView || !p.sessionToken) return <p className="t-body">This board could not be opened. <NavigationLink href="/games/blind-pick/play?mode=practice">Try again</NavigationLink></p>;
  return <BlindSession {...p} initialView={p.blindPickView} initialToken={p.sessionToken} />;
}

function BlindSession(p: HostProps & { initialView: BlindPickState; initialToken: string }) {
  const [state, setState] = useState(p.initialView);
  const [token, setToken] = useState(p.initialToken);
  const [revision, setRevision] = useState(p.sessionRevision ?? 0);
  const [run, setRun] = useState<ServerGameRun | null>(p.savedRun ?? null);
  const [name, setName] = useState(p.publishedName ?? null);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<BlindPickAction | null>(null);
  const [moveFeedback, setMoveFeedback] = useState<BoardMoveFeedback | null>(null);
  const [failedAction, setFailedAction] = useState<BlindPickAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(p.challenge);
  const [clockOrigin] = useState(() => ({ serverNow:p.serverNow, clientNow:Date.now() }));
  const busyRef = useRef(false), started = useRef(false), resultRef = useRef<HTMLDivElement>(null);
  const complete = isComplete(state.g);
  const finished = complete && state.seen;
  const previousFinished = useRef(finished);
  const count = state.g.config.categories.length;

  const send = useCallback(async (action: BlindPickAction) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setPendingAction(action); setMoveFeedback(null); setFailedAction(null); setError(null);
    try {
      const response = await commitBlindSession({ sessionToken:token, revision, action });
      setState(response.view); setToken(response.sessionToken); setRevision(response.revision);
      if (response.success && response.view.moves > state.moves && action.t !== 'seen') {
        const slot = action.t === 'place' ? action.s : state.g.placements.at(-1);
        const countryIndex = response.view.g.placements.length - Number(action.t === 'place');
        const countryName = response.view.g.config.countries[countryIndex]?.displayName;
        if (slot !== undefined && countryName) setMoveFeedback({ type: action.t, slot, revision: response.revision, countryName });
      }
      if (response.run) {
        setRun(response.run); setName(response.publishedName ?? null);
        if (p.mode === 'daily') writeDone(p.dateKey,p.edition,p.slug,response.run.scoreDisplay,Math.max(60,(p.resetAt-Date.now())/1000));
        trackCompletedRun(p.slug,p.mode,response.run.id);
      }
      if (!response.success) { setError(response.error ?? 'Your placement could not be saved. Try again.'); setFailedAction(action); }
      else if (!started.current) { started.current = true; trackPlay('play_start',p.slug,p.mode); }
    } catch { setError('Your placement was not confirmed. Your board is still here. Try again.'); setFailedAction(action); }
    finally { busyRef.current = false; setBusy(false); setPendingAction(null); }
  }, [token,revision,state,p.mode,p.dateKey,p.edition,p.resetAt,p.slug]);

  useEffect(() => {
    if (finished && !previousFinished.current) { resultRef.current?.focus({preventScroll:true}); resultRef.current?.scrollIntoView({block:'start',behavior:'instant'}); }
    previousFinished.current = finished;
  }, [finished]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (busy || finished || event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable=true]')) return;
      const slot = Number(event.key)-1;
      if (/^[1-8]$/.test(event.key) && slot < count && !complete && !state.g.placements.includes(slot)) { event.preventDefault(); void send({t:'place',s:slot}); }
      else if (event.key.toLowerCase() === 'u' && canUndo(state.g)) { event.preventDefault(); void send({t:'undo'}); }
    }
    document.addEventListener('keydown',keydown); return () => document.removeEventListener('keydown',keydown);
  }, [busy,finished,count,complete,state.g,send]);

  async function practice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setMoveFeedback(null); setError(null); setFailedAction(null);
    try { const response = await startBlindPractice(); setState(response.view); setToken(response.sessionToken); setRevision(response.revision); setRun(null); setName(null); setChallenge(undefined); started.current = false; }
    catch { setError('The next board could not be opened. Try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const result = finished ? computeResult(state.g) : null;
  const fixes = result ? swapCycles(result.placements, result.perfect, result.ranks, result.perfectRanks).length : 0;
  const shareText = result ? buildBlindPickShareText({over:result.over,marks:result.placements.map((slot,country)=>placementMark(slot,result.ranks[country],result.perfect[country],result.perfectRanks[country])),practice:p.mode==='practice'},p.dateKey) : '';
  return <div className="play-stack blind-remote" aria-busy={busy} data-phase={finished?'settled':'live'}>
    <ChallengeResult challenge={challenge} run={run}/>
    {finished && result ? <div ref={resultRef} tabIndex={-1} className="bp-result" aria-label="Blind Pick result">
      <ResultPanel feedback={<ResultFeedback slug="blind-pick"/>} slug="blind-pick" dateKey={p.mode==='daily'?p.dateKey:undefined} daily={p.mode === "daily" ? {...dailyProgress(p, p.slug, run?.scoreDisplay ?? overLabel(result.over)), resetAt: p.resetAt, serverNow: clockOrigin.serverNow, clientStartedAt: clockOrigin.clientNow} : undefined} mode={p.mode} game="Blind Pick" score={overLabel(result.over)} rank={runRank(run)} primaryAction={<ResultFollowup slug="blind-pick" mode={p.mode} score={overLabel(result.over)} run={run} publishedName={name} onPublished={setRun}/>} share={{text:shareText,challengeUrl:run?.challengeUrl,onShare:()=>trackPlay('share','blind-pick',p.mode)}} actions={p.mode==='practice'?<Button onClick={()=>void practice()} disabled={busy} pending={busy} pendingLabel="Opening" block>One more</Button>:undefined}
        outcome={fixes===0?'Perfect board':`${fixes} ${fixes===1?'fix':'fixes'} from the best fit`}
        review={<details className="bp-answers" open><summary>Your board and the best fit<span className="disclosure-count">{result.over===0?'all matched':`${result.over} ranks apart`}</span></summary><Result state={state} mode={p.mode} run={run} inPanel/></details>}>
        {p.mode==='daily'?<details className="result-week"><summary>Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity} reminder={false}/></details>:null}
      </ResultPanel>
    </div> : <><Progress className="bp-progress" done={state.g.placements.length} total={count} label="placed" value={`${state.g.placements.length} of ${count}`}/><Board state={state} dispatch={action=>void send(action)} busy={busy} pendingSlot={pendingAction?.t==='place'?pendingAction.s:null} pendingUndo={pendingAction?.t==='undo'} feedback={moveFeedback} mode={p.mode} viewer={p.viewer} seed={0}/></>}
    <span className="sr-only" role="status">{busy ? pendingAction?.t==='seen'?'Saving your result.':'Confirming your move.':''}</span>
    {error ? <div className="bp-error"><p className="t-body" role="alert">{error}</p>{failedAction?<Button variant="secondary" onClick={()=>void send(failedAction)}>Try again</Button>:null}</div>:null}
  </div>;
}
