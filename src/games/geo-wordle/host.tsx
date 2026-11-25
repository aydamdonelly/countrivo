'use client';
import { dailyProgress } from '@/features/play/daily-progress';
import {ChallengeResult} from '@/ui/challenge-result';
import {DailyHabit} from '@/ui/daily-habit';
import {SessionNotice} from '@/features/play/session-notice';
import {useEffect,useRef,useState} from 'react';
import {commitGeoWordleSession,startGeoWordlePractice} from '@/app/actions/geography-session';
import type {HostProps} from '@/games/types';
import type {GeoCommitAction} from './module';
import type {ServerGameRun} from '@/types/server';
import {Button} from '@/ui/button';
import {Progress} from '@/ui/progress';
import {ResultPanel,runRank} from '@/ui/result-panel';
import {ResultFollowup,ResultFeedback} from '@/features/play/result-followup';
import {writeDone} from '@/features/play/persist';
import {trackCompletedRun,trackPlay} from '@/lib/play-events';
import {buildGeoWordleShareText} from '@/lib/share/geo-wordle';
import {AnswerMap,Board,closestGuess,closestLabel} from './board';
import {Flag} from '@/ui/flag';
import {GeoBonus} from './result';
export function GeoWordleHost(p:HostProps){
 const [clockOrigin] = useState(() => ({serverNow:p.serverNow,clientNow:Date.now()}));
 const [challenge,setChallenge]=useState(p.challenge);
 const [view,setView]=useState(p.geoWordleView),[token,setToken]=useState(p.sessionToken??''),[revision,setRevision]=useState(p.sessionRevision??0);
 const [run,setRun]=useState<ServerGameRun|null>(p.savedRun??null),[name,setName]=useState(p.publishedName??null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[generation,setGeneration]=useState(0);
 const [pendingGuess,setPendingGuess]=useState<string|null>(null);
 const [failedAction,setFailedAction]=useState<GeoCommitAction|null>(null);
 const lock=useRef(false),started=useRef(false),resultRef=useRef<HTMLDivElement>(null),playRef=useRef<HTMLDivElement>(null);
 const phase=view?.phase,previousPhase=useRef(phase);
 useEffect(()=>{
  const before=previousPhase.current;previousPhase.current=phase;
  if(before==='playing'&&phase&&phase!=='playing'){
   resultRef.current?.focus({preventScroll:true});
   resultRef.current?.scrollIntoView({block:'start',behavior:'instant'});
  }else if(before&&before!=='playing'&&phase==='playing')playRef.current?.scrollIntoView({block:'start',behavior:'instant'});
 },[phase]);
 if(!view)return <p className="t-body">This board could not be opened. <a href={`/games/${p.slug}/play?mode=${p.mode}`}>Try again</a></p>;
 const used=view.guesses.length+(view.clueAt===null?0:1),finished=view.phase!=='playing',score=view.phase==='won'?`${used}/6`:'X/6';
 async function commit(action:GeoCommitAction){if(lock.current)return;lock.current=true;setBusy(true);setPendingGuess(action.t==='guess'?action.iso3:null);setFailedAction(null);setError(null);try{const response=await commitGeoWordleSession({sessionToken:token,revision,action});setView(response.view);setToken(response.sessionToken);setRevision(response.revision);if(response.success){if(!started.current){trackPlay('play_start',p.slug,p.mode);started.current=true;}if(response.run){setRun(response.run);setName(response.publishedName??null);if(p.mode==='daily')writeDone(p.dateKey,p.edition,p.slug,response.run.scoreDisplay,Math.max(60,(p.resetAt-Date.now())/1000));trackCompletedRun(p.slug,p.mode,response.run.id);}}else {setError(response.error??'Could not save this guess.');setFailedAction(action);}}catch{setError('Your guess was not confirmed. Check your connection.');setFailedAction(action);}finally{setBusy(false);setPendingGuess(null);lock.current=false;}}
 async function newBoard(){if(lock.current)return;lock.current=true;setBusy(true);setFailedAction(null);setError(null);try{const response=await startGeoWordlePractice();setView(response.view);setToken(response.sessionToken);setRevision(response.revision);setRun(null);setName(null);setError(null);setGeneration(n=>n+1);setChallenge(undefined);started.current=false;}catch{setError('Could not open a new board. Try again.');}finally{setBusy(false);lock.current=false;}}
 return <div ref={playRef} className="play-stack" data-phase={finished?'settled':'live'}>
  <ChallengeResult challenge={challenge} run={run}/>
  {!finished?<Progress done={used} total={6} label="" value={`${used}/6`} current={used}/>:null}
  {!finished?<Board key={generation} state={view} dispatch={action=>void commit(action)} busy={busy} pendingGuess={pendingGuess}/>:null}
  <SessionNotice busy={false} error={error} onRetry={failedAction?()=>void commit(failedAction):undefined}/>
  {finished?<>
   <div ref={resultRef} className="gw-result" tabIndex={-1} role="region" aria-label={`${view.phase==='won'?'You found':'The answer was'} ${view.answer?.name??'GeoWordle'}`}>
    <ResultPanel className="gw-result-panel" slug="geo-wordle" dateKey={p.mode==='daily'?p.dateKey:undefined} daily={p.mode === "daily" ? {...dailyProgress(p, p.slug, run?.scoreDisplay ?? score), resetAt: p.resetAt, serverNow: clockOrigin.serverNow, clientStartedAt: clockOrigin.clientNow} : undefined} feedback={<ResultFeedback slug="geo-wordle"/>} mode={p.mode} game="GeoWordle" outcome={view.phase==='won'?`Found in ${used}`:'Not found this time'} answer={view.answer?<GeoAnswerBlock view={view}/>:undefined} score={score} rank={runRank(run)} primaryAction={<ResultFollowup slug="geo-wordle" mode={p.mode} score={score} run={run} publishedName={name} onPublished={setRun}/>} share={{text:buildGeoWordleShareText({won:view.phase==='won',guesses:view.guesses,clueAt:view.clueAt},p.dateKey),challengeUrl:run?.challengeUrl,onShare:()=>trackPlay('share',p.slug,p.mode)}} actions={p.mode==='practice'?<Button onClick={()=>void newBoard()} disabled={busy} pending={busy} pendingLabel="Opening" block>One more</Button>:undefined}>
     <Board key={`route-${generation}`} state={view} dispatch={action=>void commit(action)} busy={busy}/>
     <GeoBonus key={generation} state={view}/>
     {p.mode==='daily'?<details className="result-week"><summary>Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity} reminder={false}/></details>:null}
    </ResultPanel>
   </div>
  </>:null}
 </div>;
}
/** The answer inside the result card: who it was, with its flag, how close you came, and where it is. */
function GeoAnswerBlock({view}:{view:NonNullable<HostProps['geoWordleView']>}){
 const answer=view.answer;if(!answer)return null;
 const won=view.phase==='won',closest=won?null:closestGuess(view);
 return <div className="gw-answer">
  <p className="gw-answer-kicker t-meta">{won?'You found':'The answer was'}</p>
  <p className="gw-answer-name"><Flag iso2={answer.iso2} size="m" alt="" eager/><b>{answer.name}</b></p>
  {closest?<p className="gw-answer-closest t-meta">Closest guess: {closestLabel(closest)}</p>:null}
  <AnswerMap state={view}/>
 </div>;
}
