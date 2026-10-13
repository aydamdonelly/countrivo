'use client';
import {DailyNext} from '@/ui/daily-next';
import {useRef,useState} from 'react';
import {commitPinpointSession,startPinpointPractice} from '@/app/actions/geography-session';
import type {HostProps} from '@/games/types';
import type {PinpointAction} from './module';
import type {ServerGameRun} from '@/types/server';
import {Button} from '@/ui/button';
import {Progress} from '@/ui/progress';
import {ResultPanel} from '@/ui/result-panel';
import {ShareButton} from '@/ui/share-button';
import {LeaderboardEntryForm} from '@/features/play/leaderboard-entry';
import {writeDone} from '@/features/play/persist';
import {trackPlay} from '@/lib/play-events';
import {buildPinpointShareText} from '@/lib/share/pinpoint';
import {Board} from './board';
import {PinpointResults} from './result';
export function PinpointHost(p:HostProps){
 const [clockOrigin] = useState(() => ({serverNow:p.serverNow,clientNow:Date.now()}));
 const [view,setView]=useState(p.pinpointView),[token,setToken]=useState(p.sessionToken??''),[revision,setRevision]=useState(p.sessionRevision??0);
 const [run,setRun]=useState<ServerGameRun|null>(p.savedRun??null),[name,setName]=useState(p.publishedName??null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[generation,setGeneration]=useState(0);
 const lock=useRef(false),started=useRef(false);
 if(!view)return <p className="t-body">This board could not be opened. <a href={`/games/${p.slug}/play?mode=${p.mode}`}>Try again</a></p>;
 const finished=view.phase==='finished',next=p.dailies.find(d=>d.slug!==p.slug&&!p.shotToday.includes(d.slug));
 async function commit(action:PinpointAction){if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{const response=await commitPinpointSession({sessionToken:token,revision,action});if(response.success){if(!started.current){trackPlay('play_start',p.slug,p.mode);started.current=true;}setView(response.view);setToken(response.sessionToken);setRevision(response.revision);if(response.run){setRun(response.run);setName(response.publishedName??null);if(p.mode==='daily')writeDone(p.dateKey,p.edition,p.slug,response.run.scoreDisplay,Math.max(60,(p.resetAt-Date.now())/1000));trackPlay('play_finish',p.slug,p.mode);}}else setError(response.error??'Could not save this pin. Try again.');}catch{setError('Could not save this pin. Check your connection and try again.');}finally{setBusy(false);lock.current=false;}}
 async function newBoard(){if(lock.current)return;lock.current=true;setBusy(true);try{const response=await startPinpointPractice();setView(response.view);setToken(response.sessionToken);setRevision(response.revision);setRun(null);setName(null);setError(null);setGeneration(n=>n+1);started.current=false;}catch{setError('Could not open a new board. Try again.');}finally{setBusy(false);lock.current=false;}}
 return <div className="play-stack" data-phase={finished?'settled':'live'}>{!finished?<><Progress done={view.results.length} total={5} label="score" value={String(view.score)} extra="of 1,200" current={view.phase==='placing'?view.round:null}/><Board key={generation} state={view} dispatch={action=>void commit(action)} busy={busy}/></>:<><ResultPanel mode={p.mode} game="Pinpoint" score={`${view.score} of 1,200`} kicker={p.mode==='daily'?'Today · Pinpoint':'Practice · Pinpoint'} counter="Par 720" animateScore actions={<>{p.mode==='practice'?<Button variant="ink" onClick={()=>void newBoard()} disabled={busy}>One more</Button>:null}<ShareButton text={buildPinpointShareText(view.results,p.dateKey)} onShare={()=>trackPlay('share',p.slug,p.mode)}/></>}><PinpointResults state={view}/>{run&&p.mode==='daily'?<LeaderboardEntryForm run={run} publishedName={name} onPublished={setRun}/>:null}</ResultPanel>{p.mode==='daily'?<DailyNext next={next} resetAt={p.resetAt} serverNow={clockOrigin.serverNow} clientStartedAt={clockOrigin.clientNow}/>:null}</>}{busy?<p className="t-meta text-mute" role="status">Saving your move…</p>:null}{error?<p className="t-body text-ember" role="alert">{error}</p>:null}</div>;
}
