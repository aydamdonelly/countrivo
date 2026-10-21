'use client';
import {DailyNext} from '@/ui/daily-next';
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
import {ResultPanel} from '@/ui/result-panel';
import {ShareButton} from '@/ui/share-button';
import {ResultFollowup,ResultFeedback} from '@/features/play/result-followup';
import {writeDone} from '@/features/play/persist';
import {trackCompletedRun,trackPlay} from '@/lib/play-events';
import {buildGeoWordleShareText} from '@/lib/share/geo-wordle';
import {Board} from './board';
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
 const next=p.dailies.find(d=>d.slug!==p.slug&&!p.shotToday.includes(d.slug));
 async function commit(action:GeoCommitAction){if(lock.current)return;lock.current=true;setBusy(true);setPendingGuess(action.t==='guess'?action.iso3:null);setFailedAction(null);setError(null);try{const response=await commitGeoWordleSession({sessionToken:token,revision,action});setView(response.view);setToken(response.sessionToken);setRevision(response.revision);if(response.success){if(!started.current){trackPlay('play_start',p.slug,p.mode);started.current=true;}if(response.run){setRun(response.run);setName(response.publishedName??null);if(p.mode==='daily')writeDone(p.dateKey,p.edition,p.slug,response.run.scoreDisplay,Math.max(60,(p.resetAt-Date.now())/1000));trackCompletedRun(p.slug,p.mode,response.run.id);}}else {setError(response.error??'Could not save this guess.');setFailedAction(action);}}catch{setError('Your guess was not confirmed. Check your connection.');setFailedAction(action);}finally{setBusy(false);setPendingGuess(null);lock.current=false;}}
 async function newBoard(){if(lock.current)return;lock.current=true;setBusy(true);setFailedAction(null);setError(null);try{const response=await startGeoWordlePractice();setView(response.view);setToken(response.sessionToken);setRevision(response.revision);setRun(null);setName(null);setError(null);setGeneration(n=>n+1);setChallenge(undefined);started.current=false;}catch{setError('Could not open a new board. Try again.');}finally{setBusy(false);lock.current=false;}}
 return <div ref={playRef} className="play-stack" data-phase={finished?'settled':'live'}>
  <ChallengeResult challenge={challenge} run={run}/>
  <Progress done={used} total={6} label="" value={finished?score:`${used}/6`} current={finished?null:used}/>
  {!finished?<Board key={generation} state={view} dispatch={action=>void commit(action)} busy={busy} pendingGuess={pendingGuess}/>:null}
  <SessionNotice busy={busy} error={error} pendingLabel="Checking your guess…" onRetry={failedAction?()=>void commit(failedAction):undefined}/>
  {finished?<>
   <div ref={resultRef} className="gw-result" tabIndex={-1} role="region" aria-label={`${view.phase==='won'?'Found':'Answer'}: ${view.answer?.name??'GeoWordle'}`}>
    <h2 className="gw-result-title t-h2">{view.answer?.name}</h2>
    <ResultPanel className="gw-result-panel" feedback={<ResultFeedback slug="geo-wordle"/>} mode={p.mode} game="GeoWordle" outcome={view.phase==='won'?'Country found':'Out of guesses'} score={score} primaryAction={<ResultFollowup slug="geo-wordle" mode={p.mode} score={score} run={run} publishedName={name} onPublished={setRun}/>} kicker={p.mode==='daily'?'Today · GeoWordle':'Practice · GeoWordle'} counter="Par 4" actions={<>{p.mode==='practice'?<Button variant="ink" onClick={()=>void newBoard()} disabled={busy} pending={busy} pendingLabel="Opening…">One more</Button>:null}<ShareButton challengeUrl={run?.challengeUrl} text={buildGeoWordleShareText({won:view.phase==='won',guesses:view.guesses,clueAt:view.clueAt},p.dateKey)} onShare={()=>trackPlay('share',p.slug,p.mode)}/></>}>
     <GeoBonus key={generation} state={view}/>
     {p.mode==='daily'?<><DailyNext next={next} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow}/><details className="result-week"><summary className="t-meta">Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity}/></details></>:null}
    </ResultPanel>
   </div>
   <Board key={`route-${generation}`} state={view} dispatch={action=>void commit(action)} busy={busy}/>
  </>:null}
 </div>;
}
