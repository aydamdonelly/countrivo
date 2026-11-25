import {useMemo,useRef,useState,type MouseEvent} from 'react';
import {centroids,countries} from '@/lib/data/public';
import {mapCountryPaths} from '@/lib/data/map-country-paths';
import {coastline} from '@/lib/data/coastline';
import type {GeoWordleView,GeoGuess} from '@/lib/game-logic/geo-wordle/engine';
import {resolveGuess,suggestCountries} from '@/lib/game-logic/geo-wordle/input';
import {projectPoint} from '@/lib/game-logic/map-projection';
import {Button} from '@/ui/button';
import {Flag} from '@/ui/flag';
import {Clay} from '@/ui/clay';
import {CheckIcon} from '@/ui/icons/check';
import {Suggest,type SuggestItem} from '@/ui/suggest';
import type {GeoCommitAction} from './module';
import './geo-wordle.css';
interface GeoBoardProps {state:GeoWordleView;dispatch:(action:GeoCommitAction)=>void;busy:boolean;pendingGuess?:string|null}
function kmLabel(km:number):string{return `${String(Math.max(0,Math.round(km))).replace(/\B(?=(\d{3})+(?!\d))/g,' ')} km`;}
function bandLabel(g:GeoGuess):string {return g.correct?'Found it':g.sharedBorder?'Neighbour':g.distanceKm===0?'Very close':g.band[0].toUpperCase()+g.band.slice(1);}
function Arrow({bearing,direction}:{bearing:number;direction:string}){return <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={`Country centre to the ${direction}`} style={{transform:`rotate(${Math.round(bearing-90)}deg)`}}><path d="M4 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
/** The projected bounding box of an SVG path's absolute M/L points. */
function pathBox(path:string):{x:number;y:number;w:number;h:number}|null{
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const m of path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)){const x=Number(m[1]),y=Number(m[2]);if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
 return Number.isFinite(minX)?{x:minX,y:minY,w:maxX-minX,h:maxY-minY}:null;
}
function centroidPoint(iso3:string){const c=centroids[iso3];return c?projectPoint({lat:c[0],lng:c[1]}):null;}
/**
 * The guess map. While playing: guesses in their heat colour (the latest outlined in ink),
 * small countries also as a dot so the colour reads at world zoom. Finished: the answer in
 * ink (no heat colour is ink) with a paper halo and its name, and dashed routes from each guess.
 */
function GuessMap({state,onPick,pendingIso3,className}:{state:GeoWordleView;onPick?:(x:number,y:number)=>void;pendingIso3?:string|null;className?:string}){
 const answer=state.answer?centroidPoint(state.answer.iso3):null,finished=state.phase!=='playing';
 let viewBox=coastline.viewBox,frameWidth=720;
 const points=state.guesses.map(g=>centroidPoint(g.iso3)).filter((p):p is {x:number;y:number}=>!!p);
 if(answer)points.push(answer);
 if(points.length){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  // One guess: a regional frame around it (half the world wide), so its colour reads.
  const w=points.length>1?Math.max(100,Math.max(...xs)-Math.min(...xs)+100):480,h=points.length>1?Math.max(60,Math.max(...ys)-Math.min(...ys)+70):0;
  const width=Math.min(720,Math.max(w,h*2));frameWidth=width;
  const x=Math.max(0,Math.min(720-width,cx-width/2)),y=width/2>=300?150-width/4:Math.max(0,Math.min(300-width/2,cy-width/4));
  viewBox=`${x} ${y} ${width} ${width/2}`;}
 const k=frameWidth/720;
 function pick(e:MouseEvent<SVGSVGElement>){if(state.phase!=='playing'||!onPick)return;const matrix=e.currentTarget.getScreenCTM();if(!matrix)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());onPick(point.x,point.y);}
 const latest=state.guesses.at(-1);
 return <svg className={`gw-map${state.phase==='playing'&&onPick?' gw-map-live':''}${className?` ${className}`:''}`} onClick={pick} viewBox={viewBox} role="img" aria-label={finished&&state.answer?`Map: ${state.answer.name} highlighted, with your ${state.guesses.length} ${state.guesses.length===1?'guess':'guesses'}`:`${state.guesses.length} guessed countries on the map`}>
  <path d={coastline.land} fill="var(--color-wait)"/>
  {state.guesses.map(g=>{
   if(g.correct&&state.answerPath)return null;
   const d=state.guessPaths[g.iso3],box=d?pathBox(d):null,centre=centroidPoint(g.iso3);
   const small=!box||Math.max(box.w,box.h)<frameWidth/60;
   const outline=!finished&&g===latest;
   return <g key={g.iso3}>{d?<path d={d} className={`gw-land gw-heat-${g.band}`} stroke={outline?'var(--color-ink)':'var(--color-paper)'} strokeWidth={outline?1.25:0.75} vectorEffect="non-scaling-stroke"/>:null}
    {small&&centre?<circle className={`gw-land gw-dot gw-heat-${g.band}`} cx={centre.x} cy={centre.y} r={4*k} stroke={outline?'var(--color-ink)':'var(--color-paper)'} strokeWidth="1" vectorEffect="non-scaling-stroke"/>:null}</g>;
  })}
  {pendingIso3&&mapCountryPaths[pendingIso3]?<path className="gw-pending-land" d={mapCountryPaths[pendingIso3]} vectorEffect="non-scaling-stroke"/>:null}
  {answer?state.guesses.filter(g=>!g.correct).map(g=>{const a=centroidPoint(g.iso3);if(!a)return null;return Math.abs(a.x-answer.x)<360?<line key={`route-${g.iso3}`} className="gw-route" x1={a.x} y1={a.y} x2={answer.x} y2={answer.y} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"/>:null;}):null}
  {state.answerPath?<path className="gw-answer-land" d={state.answerPath} vectorEffect="non-scaling-stroke"/>:null}
  {answer?<circle className="gw-answer-dot" cx={answer.x} cy={answer.y} r={4.5*k} vectorEffect="non-scaling-stroke"/>:null}
  {answer&&state.answer?<text className="gw-answer-label" x={answer.x} y={answer.y-frameWidth/60} fontSize={frameWidth/24} textAnchor="middle">{state.answer.name}</text>:null}
 </svg>;
}
/** The finished map for the result card: the answer, your guesses and the routes. */
export function AnswerMap({state}:{state:GeoWordleView}){
 return <><GuessMap state={state} className="gw-answer-map"/><div className="gw-legend t-meta text-mute" aria-hidden="true"><span className="gw-legend-answer"><i className="gw-heat-dot gw-answer-swatch"/>Answer</span><span className="gw-legend-heat">Guesses: cold<span className="gw-legend-colours">{['cold','cool','warm','hot','burning'].map(band=><i key={band} className={`gw-heat-dot gw-heat-${band}`}/>)}</span>close</span></div></>;
}
/** The guess that came closest: the smallest distance, a neighbour counting as 0 km. */
export function closestGuess(state:GeoWordleView):GeoGuess|null{
 const misses=state.guesses.filter(g=>!g.correct);
 if(!misses.length)return null;
 return misses.reduce((best,g)=>g.distanceKm<best.distanceKm||(g.distanceKm===best.distanceKm&&g.sharedBorder&&!best.sharedBorder)?g:best);
}
export function closestLabel(g:GeoGuess):string{return g.sharedBorder?`${g.name}, a neighbour`:g.distanceKm===0?`${g.name}, under 1 km`:`${g.name}, ${kmLabel(g.distanceKm)}`;}
export function Board({state,dispatch,busy,pendingGuess}:GeoBoardProps){
 const [query,setQuery]=useState({text:'',turn:state.guesses.length}),[error,setError]=useState<string|null>(null),[confirmClue,setConfirmClue]=useState(false);
 const [mapChoice,setMapChoice]=useState<{iso3:string;name:string}|null>(null);
 const text=query.turn===state.guesses.length?query.text:'';
 function setText(value:string){setQuery({text:value,turn:state.guesses.length});}
 const hitContext=useRef<CanvasRenderingContext2D|null>(null),hitPaths=useRef(new Map<string,Path2D>());
 const field=useRef<HTMLDivElement>(null),live=state.phase==='playing';
 const guessed=useMemo(()=>new Set(state.guesses.map(g=>g.iso3)),[state.guesses]);
 const items:SuggestItem[]=useMemo(()=>suggestCountries(text,guessed,6).map(c=>({key:c.iso3,iso2:c.iso2,name:c.displayName})),[text,guessed]);
 function pickMap(x:number,y:number){
  if(!live)return;
  const context=hitContext.current??document.createElement('canvas').getContext('2d');
  if(!context){setError('Type a country below to make your guess.');return;}
  hitContext.current=context;
  for(const country of countries){
   const outline=mapCountryPaths[country.iso3];if(!outline)continue;
   let path=hitPaths.current.get(country.iso3);
   if(!path){path=new Path2D(outline);hitPaths.current.set(country.iso3,path);}
   if(!context.isPointInPath(path,x,y))continue;
   if(guessed.has(country.iso3)){setMapChoice(null);setError('Already guessed. Try another country.');}
   else {setMapChoice({iso3:country.iso3,name:country.displayName});setError(null);}
   return;
  }
  setMapChoice(null);setError('Tap land, or type a country.');
 }
 function guess(iso3:string){if(busy)return;setMapChoice(null);if(guessed.has(iso3)){setError('Already guessed. Try another country.');return;}setText(countries.find(country=>country.iso3===iso3)?.displayName??'');setError(null);dispatch({t:'guess',iso3});field.current?.querySelector('input')?.focus();}
 function submit(raw:string){if(busy||!raw.trim())return;const country=resolveGuess(raw);if(!country){setError('No country by that name. Try another spelling.');return;}guess(country.iso3);}
 const used=state.guesses.length+(state.clueAt===null?0:1);
 const pending=pendingGuess?countries.find(country=>country.iso3===pendingGuess):null;
 const source=<details className="gw-source"><summary className="t-meta">Distance &amp; direction</summary><p className="t-meta text-mute">Kilometres measure the nearest borders. Neighbours share a border; they are not the answer. Arrows point towards the country’s centre, so they may differ from the nearest border. Unmapped territories use centre distance. Natural Earth 1:50m.</p></details>;
 const closest=live?null:closestGuess(state);
 const map=<>
  <GuessMap state={state} onPick={pickMap} pendingIso3={pendingGuess}/>
  {state.guesses.length?<div className="gw-legend t-meta text-mute" aria-label="Map colours run from cold blue to close red"><span>Cold</span><span className="gw-legend-colours" aria-hidden="true">{['cold','cool','warm','hot','burning'].map(band=><i key={band} className={`gw-heat-dot gw-heat-${band}`}/>)}</span><span>Close</span></div>:null}
  {mapChoice&&live?<div className="gw-confirm"><div><Button variant="primary" disabled={busy} pending={busy} pendingLabel="Checking…" onClick={e=>{if(e.detail<2)guess(mapChoice.iso3);}}>Guess {mapChoice.name}</Button><Button variant="tertiary" onClick={()=>setMapChoice(null)}>Not now</Button></div></div>:null}
 </>;
 const clue=state.clue?<div className="gw-clue">{state.clue.label?<p className="t-h3">{state.clue.label}</p>:<svg viewBox={state.clue.viewBox} role="img" aria-label="Outline clue of the hidden country"><path d={state.clue.path} fill="var(--color-ink)"/></svg>}<p className="t-meta text-mute">Outline · −1 guess</p></div>:null;
 const slots=Array.from({length:6},(_,i)=>{
   const isClue=state.clueAt===i,guessIndex=state.clueAt!==null&&i>state.clueAt?i-1:i,g=isClue?null:state.guesses[guessIndex];
   if(isClue)return <div key="clue" className="gw-row gw-empty"><span className="gw-pip"/><span className="t-meta">Outline · −1</span></div>;
   if(!g&&i===used&&pending)return <div className="gw-row gw-pending" key={pending.iso3}><div className="gw-country"><Flag iso2={pending.iso2} size="xs" alt="" eager/><span className="t-body">{pending.displayName}</span></div><span className="gw-pending-art"><Clay object="cl-02" sizes="40px" loading="eager"/><span className="sr-only">Confirming your guess</span></span></div>;
   if(!g)return null;
   return <div key={g.iso3} className={`gw-row gw-heat-${g.band}`}><div className="gw-country"><Flag iso2={g.iso2} size="xs" alt="" eager/><span className="t-body">{g.name}</span>{closest===g?<span className="gw-closest t-meta">Closest</span>:null}</div><div className={`gw-readout${g.sharedBorder?' gw-neighbour':''}`}>
    {g.correct?<><CheckIcon size={24}/><span className="t-meta">Found it</span></>:g.sharedBorder?<><b className="t-body">Neighbour</b><span className="t-meta text-mute">Shared border · 0 km</span></>:<><b className="t-score num">{g.distanceKm===0?'Very close':kmLabel(g.distanceKm)}</b><Arrow bearing={g.bearingDeg} direction={g.direction}/><span className="gw-band t-meta text-mute"><i className="gw-heat-dot" aria-hidden="true"/>{g.distanceKm===0?'Under 1 km':bandLabel(g)}</span>{g.distanceBasis==='centres'?<small className="t-meta text-mute">centre</small>:null}</>}
   </div></div>;
  }).filter(row=>row!==null);
 // While playing the newest row sits next to the input; the finished list reads as a route.
 const rows=<div className="gw-rows" aria-live="polite">{live?slots.reverse():slots}</div>;
 if(!live)return <details className="gw-history"><summary className="t-body">Your guesses <span className="disclosure-count">{state.guesses.length} {state.guesses.length===1?'guess':'guesses'}{state.clueAt!==null?' and the outline':''}</span></summary><div className="gw-board">{clue}{rows}{source}</div></details>;
 return <div className="gw-board">
  {state.guesses.length===0?<p className="gw-start t-body">Find the hidden country in 6 guesses. Tap the map or type a country.</p>:null}
  {map}
  <div className="gw-input" ref={field}><Suggest id="geo-guess" label="Country" hideLabel placeholder="Type a country" value={text} onChange={v=>{setText(v);setMapChoice(null);setError(null);}} items={items} onSelect={item=>guess(item.key)} onSubmit={submit} autoSelectFirst={false} readOnly={busy} max={6} error={error} autoComplete="off" autoCapitalize="words" enterKeyHint="go"/><Button variant="primary" onClick={e=>{if(e.detail<2)submit(text);}} disabled={busy||!text.trim()} pending={busy}>Guess</Button></div>
  {state.guesses.length>=2&&state.clueAt===null?<div className="gw-clue-control">{confirmClue?<div className="gw-confirm"><p className="t-body">Outline costs 1 guess.</p><div><Button variant="primary" onClick={e=>{if(e.detail<2){dispatch({t:'clue'});setConfirmClue(false);}}} disabled={busy} pending={busy} pendingLabel="Opening the clue…">Show outline</Button><Button variant="tertiary" onClick={()=>setConfirmClue(false)}>Not now</Button></div></div>:<Button variant="tertiary" onClick={()=>setConfirmClue(true)} disabled={busy}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 5 2 4-1 3 5-2 4 1 5-6 3-5-2-4-5 2-4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"/></svg>Outline · −1 guess</Button>}</div>:null}
  {clue}
  {rows}
  {source}
 </div>;
}
