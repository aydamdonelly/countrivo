import { coastline } from '@/lib/data/coastline';
import { projectPoint } from '@/lib/game-logic/map-projection';
import type { PinpointRoundResult, PinpointState, PinpointView } from '@/lib/game-logic/pinpoint/engine';
import type { ResultProps } from '@/games/types';

function kmLabel(n:number):string{return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ")} km`;}

/** The card's verdict: how many pins landed inside, or how close the best one came. */
export function pinpointOutcome(results:readonly PinpointRoundResult[]):string {
 const inside=results.filter(r=>r.inside).length;
 if(results.length&&inside===results.length)return 'Every pin inside';
 if(inside)return `${inside} of ${results.length} pins inside`;
 const best=results.reduce<PinpointRoundResult|null>((b,r)=>!b||r.distanceKm<b.distanceKm?r:b,null);
 return best?`Closest pin ${kmLabel(best.distanceKm)} from ${best.name}`:'Five pins placed';
}

function centreOf(path:string):{x:number;y:number}|null {
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const m of path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)){const x=Number(m[1]),y=Number(m[2]);if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
 return Number.isFinite(minX)?{x:(minX+maxX)/2,y:(minY+maxY)/2}:null;
}

/** The five places on one world map: each country filled and numbered, your pin and the way to its border. */
function PlacesMap({results}:{results:readonly PinpointRoundResult[]}) {
 return <svg className="pp-places-map" viewBox={coastline.viewBox} role="img" aria-label={`World map of the five places: ${results.map(r=>r.name).join(', ')}, with your pins`}>
  <path className="pp-coast" d={coastline.land} vectorEffect="non-scaling-stroke"/>
  {results.map(r=><path key={`land-${r.iso3}`} className="pp-answer-land" d={r.path} vectorEffect="non-scaling-stroke"/>)}
  {results.map((r,i)=>{const pin=projectPoint(r),near=projectPoint(r.nearest),centre=centreOf(r.path)??near;return <g key={`pin-${r.iso3}`}>
   {!r.inside&&Math.abs(pin.x-near.x)<360?<line x1={pin.x} y1={pin.y} x2={near.x} y2={near.y} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="3 2" vectorEffect="non-scaling-stroke"/>:null}
   <circle cx={pin.x} cy={pin.y} r="3" fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
   <text className="pp-place-number" x={centre.x} y={centre.y+7} fontSize="22" textAnchor="middle">{i+1}</text>
  </g>;})}
 </svg>;
}

export function PinpointResults({state}:{state:PinpointView|PinpointState}) {
 return <div className="pp-results">
  <PlacesMap results={state.results}/>
  {state.results.map((r,i)=><div className="pp-result" key={r.iso3}><span className="t-meta num">{i+1}</span><span>{r.name}<small className="t-meta text-mute">{r.inside?'Your pin was inside':`Your pin was ${kmLabel(r.distanceKm)} away`}{i===4?' · counted double':''}</small>{r.where?<small className="t-meta text-mute">{r.where}</small>:null}</span><b className="t-score num">{r.points}</b></div>)}
 </div>;
}
export function Result({state}:ResultProps<PinpointState>){return <PinpointResults state={state}/>;}
