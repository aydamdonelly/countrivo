import type { PinpointState,PinpointView } from '@/lib/game-logic/pinpoint/engine';
import type { ResultProps } from '@/games/types';

function kmLabel(n:number):string{return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ")} km`;}
export function PinpointResults({state}:{state:PinpointView|PinpointState}) {
 return <div className="pp-results"><div className="rhead"><b className="t-h3">How close you came</b><span className="t-meta">Par 720</span></div>{state.results.map((r,i)=><div className="pp-result" key={r.iso3}><span className="t-meta">{i+1}</span><span>{r.name}<small className="t-meta text-mute">{r.inside?'Inside':`${kmLabel(r.distanceKm)} away`}{i===4?' · counted double':''}</small></span><b className="t-score num">{r.points}</b></div>)}</div>;
}
export function Result({state}:ResultProps<PinpointState>){return <PinpointResults state={state}/>;}
