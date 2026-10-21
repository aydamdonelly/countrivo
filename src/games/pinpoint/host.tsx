'use client';
import {DailyNext} from '@/ui/daily-next';
import {ChallengeResult} from '@/ui/challenge-result';
import {DailyHabit} from '@/ui/daily-habit';
import {SessionNotice} from '@/features/play/session-notice';
import type {PinpointView} from '@/lib/game-logic/pinpoint/engine';
import {useEffect,useRef,useState} from 'react';
import {commitPinpointSession,startPinpointPractice} from '@/app/actions/geography-session';
import type {HostProps} from '@/games/types';
import type {PinpointAction} from './module';
import type {ServerGameRun} from '@/types/server';
import {Button} from '@/ui/button';
import {Progress} from '@/ui/progress';
import {ResultPanel} from '@/ui/result-panel';
import {ShareButton} from '@/ui/share-button';
import {ResultFollowup,ResultFeedback} from '@/features/play/result-followup';
import {writeDone} from '@/features/play/persist';
import {trackCompletedRun,trackPlay} from '@/lib/play-events';
import {buildPinpointShareText} from '@/lib/share/pinpoint';
import {Board} from './board';
import {PinpointResults} from './result';
export function PinpointHost(p:HostProps){
 const [clockOrigin] = useState(() => ({serverNow:p.serverNow,clientNow:Date.now()}));
 const [challenge,setChallenge]=useState(p.challenge);
 const [view,setView]=useState(p.pinpointView),[token,setToken]=useState(p.sessionToken??''),[revision,setRevision]=useState(p.sessionRevision??0);
 const [run,setRun]=useState<ServerGameRun|null>(p.savedRun??null),[name,setName]=useState(p.publishedName??null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[generation,setGeneration]=useState(0);
 const lock=useRef(false),started=useRef(false);
 const resultRef=useRef<HTMLDivElement>(null),previousPhase=useRef(view?.phase);
 useEffect(()=>{const before=previousPhase.current;previousPhase.current=view?.phase;if(before&&before!=='finished'&&view?.phase==='finished'){resultRef.current?.focus({preventScroll:true});resultRef.current?.scrollIntoView({block:'start',behavior:'instant'});}},[view?.phase]);
 const [preview,setPreview]=useState<PinpointView|null>(null);
 const [failedAction,setFailedAction]=useState<PinpointAction|null>(null);
 if(!view)return <p className="t-body">This board could not be opened. <a href={`/games/${p.slug}/play?mode=${p.mode}`}>Try again</a></p>;
 const finished=view.phase==='finished',next=p.dailies.find(d=>d.slug!==p.slug&&!p.shotToday.includes(d.slug));
 async function commit(action:PinpointAction){if(lock.current)return;lock.current=true;setBusy(true);setError(null);setFailedAction(null);if(action.t==='next'&&view?.nextView?.phase==='placing')setPreview(view.nextView);try{const response=await commitPinpointSession({sessionToken:token,revision,action});setView(response.view);setToken(response.sessionToken);setRevision(response.revision);if(response.success){if(!started.current){trackPlay('play_start',p.slug,p.mode);started.current=true;}if(response.run){setRun(response.run);setName(response.publishedName??null);if(p.mode==='daily')writeDone(p.dateKey,p.edition,p.slug,response.run.scoreDisplay,Math.max(60,(p.resetAt-Date.now())/1000));trackCompletedRun(p.slug,p.mode,response.run.id);}}else {setError(response.error??'Could not save this pin.');setFailedAction(action);}}catch{setError('Your move was not confirmed. Check your connection.');setFailedAction(action);}finally{setBusy(false);lock.current=false;setPreview(null);}}
 async function newBoard(){if(lock.current)return;lock.current=true;setBusy(true);setError(null);setFailedAction(null);try{const response=await startPinpointPractice();setView(response.view);setToken(response.sessionToken);setRevision(response.revision);setRun(null);setName(null);setError(null);setGeneration(n=>n+1);setChallenge(undefined);started.current=false;}catch{setError('Could not open a new board. Try again.');}finally{setBusy(false);lock.current=false;}}
 const stage=preview??view;
 return <div className="play-stack" data-phase={finished?'settled':'live'}><ChallengeResult challenge={challenge} run={run}/>{!finished?<><Progress done={view.results.length} total={5} label="score" value={String(view.score)} extra="of 1,200" current={view.phase==='placing'?view.round:null}/><Board key={generation} state={stage} dispatch={action=>void commit(action)} busy={busy&&!preview} commitBusy={busy}/></>:<div ref={resultRef} tabIndex={-1} role="region" aria-label="Pinpoint result"><ResultPanel feedback={<ResultFeedback slug="pinpoint"/>} mode={p.mode} game="Pinpoint" primaryAction={<ResultFollowup slug="pinpoint" mode={p.mode} score={`${view.score} / 1,200`} run={run} publishedName={name} onPublished={setRun}/>} score={`${view.score} of 1,200`} kicker={p.mode==='daily'?'Today · Pinpoint':'Practice · Pinpoint'} counter="Par 720" animateScore actions={<>{p.mode==='practice'?<Button variant="ink" onClick={()=>void newBoard()} disabled={busy} pending={busy} pendingLabel="Opening…">One more</Button>:null}<ShareButton challengeUrl={run?.challengeUrl} text={buildPinpointShareText(view.results,p.dateKey)} onShare={()=>trackPlay('share',p.slug,p.mode)}/></>}>{p.mode==='daily'?<><DailyNext next={next} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow}/><details className="result-week"><summary className="t-meta">Your week</summary><DailyHabit dateKey={p.dateKey} activity={p.activity}/></details></>:null}<PinpointResults state={view}/></ResultPanel></div>}<SessionNotice busy={busy} error={error} pendingLabel={preview?'Opening the next country…':'Confirming your pin…'} onRetry={failedAction?()=>void commit(failedAction):undefined}/></div>;
}
