import {useMemo,useRef,useState,type MouseEvent} from 'react';
import {centroids,countries} from '@/lib/data/public';
import {mapCountryPaths} from '@/lib/data/map-country-paths';
import {coastline} from '@/lib/data/coastline';
import type {GeoWordleView,GeoGuess} from '@/lib/game-logic/geo-wordle/engine';
import {resolveGuess,suggestCountries} from '@/lib/game-logic/geo-wordle/input';
import {projectPoint} from '@/lib/game-logic/map-projection';
import {Button} from '@/ui/button';
import {Flag} from '@/ui/flag';
import {CheckIcon} from '@/ui/icons/check';
import {Suggest,type SuggestItem} from '@/ui/suggest';
import type {GeoCommitAction} from './module';
import './geo-wordle.css';
interface GeoBoardProps {state:GeoWordleView;dispatch:(action:GeoCommitAction)=>void;busy:boolean;pendingGuess?:string|null}
function kmLabel(km:number):string{return `${String(Math.max(0,Math.round(km))).replace(/\B(?=(\d{3})+(?!\d))/g,' ')} km`;}
function bandLabel(g:GeoGuess):string {return g.correct?'Found it':g.sharedBorder?'Neighbour':g.distanceKm===0?'Very close':g.band[0].toUpperCase()+g.band.slice(1);}
function Arrow({bearing,direction}:{bearing:number;direction:string}){return <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={`Country centre to the ${direction}`} style={{transform:`rotate(${Math.round(bearing-90)}deg)`}}><path d="M4 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function GuessMap({state,onPick}:{state:GeoWordleView;onPick:(x:number,y:number)=>void}){
 const answer=state.answer?centroids[state.answer.iso3]:null;
 let viewBox=coastline.viewBox;
 if(state.guesses.length){const points=state.guesses.map(g=>centroids[g.iso3]).filter((p):p is number[]=>!!p).map(p=>projectPoint({lat:p[0],lng:p[1]}));if(answer)points.push(projectPoint({lat:answer[0],lng:answer[1]}));if(points.length>1){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,w=Math.max(100,Math.max(...xs)-Math.min(...xs)+100),h=Math.max(60,Math.max(...ys)-Math.min(...ys)+70);const width=Math.max(w,h*2);viewBox=`${cx-width/2} ${cy-width/4} ${width} ${width/2}`;}}
 function pick(e:MouseEvent<SVGSVGElement>){if(state.phase!=='playing')return;const matrix=e.currentTarget.getScreenCTM();if(!matrix)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());onPick(point.x,point.y);}
 return <svg className={`gw-map${state.phase==='playing'?' gw-map-live':''}`} onClick={pick} viewBox={viewBox} role="img" aria-label={`${state.guesses.length} guessed countries on the map${state.answer?', with the answer revealed':''}`}><path d={coastline.land} fill="var(--color-wait)"/>{state.guesses.map(g=>state.guessPaths[g.iso3]?<path key={g.iso3} d={state.guessPaths[g.iso3]} className={`gw-land gw-heat-${g.band}`} stroke="var(--color-ink)" strokeWidth={g===state.guesses.at(-1)?2.5:1.5} vectorEffect="non-scaling-stroke"/>:centroids[g.iso3]?<circle className={`gw-land gw-heat-${g.band}`} key={g.iso3} cx={projectPoint({lat:centroids[g.iso3][0],lng:centroids[g.iso3][1]}).x} cy={projectPoint({lat:centroids[g.iso3][0],lng:centroids[g.iso3][1]}).y} r="4"/>:null)}{state.answerPath?<path d={state.answerPath} fill="var(--color-ink)"/>:null}{answer?state.guesses.filter(g=>!g.correct).map(g=>{const from=centroids[g.iso3];if(!from)return null;const a=projectPoint({lat:from[0],lng:from[1]}),b=projectPoint({lat:answer[0],lng:answer[1]});return Math.abs(a.x-b.x)<360?<line key={`route-${g.iso3}`} className="gw-route" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"/>:null;}):null}</svg>;
}
export function Board({state,dispatch,busy,pendingGuess}:GeoBoardProps){
 const [text,setText]=useState(''),[error,setError]=useState<string|null>(null),[confirmClue,setConfirmClue]=useState(false);
 const [mapChoice,setMapChoice]=useState<{iso3:string;name:string}|null>(null);
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
 function guess(iso3:string){if(busy)return;setMapChoice(null);if(guessed.has(iso3)){setError('Already guessed. Try another country.');return;}setText('');setError(null);dispatch({t:'guess',iso3});field.current?.querySelector('input')?.focus();}
 function submit(raw:string){if(busy||!raw.trim())return;const country=resolveGuess(raw);if(!country){setError('No country by that name. Try another spelling.');return;}guess(country.iso3);}
 const used=state.guesses.length+(state.clueAt===null?0:1);
 const pending=pendingGuess?countries.find(country=>country.iso3===pendingGuess):null;
 const source=<details className="gw-source"><summary className="t-meta">Distance &amp; direction</summary><p className="t-meta text-mute">Kilometres measure the nearest borders. Neighbours share a border; they are not the answer. Arrows point towards the country’s centre, so they may differ from the nearest border. Unmapped territories use centre distance. Natural Earth 1:50m.</p></details>;
 const history=<>
  <GuessMap state={state} onPick={pickMap}/>
  {state.guesses.length?<div className="gw-legend t-meta text-mute" aria-label="Map colours run from cold blue to close red"><span>Cold</span><span className="gw-legend-colours" aria-hidden="true">{['cold','cool','warm','hot','burning'].map(band=><i key={band} className={`gw-heat-dot gw-heat-${band}`}/>)}</span><span>Close</span></div>:null}
  {mapChoice&&live?<div className="gw-confirm"><div><Button variant="ink" disabled={busy} pending={busy} pendingLabel="Checking…" onClick={e=>{if(e.detail<2)guess(mapChoice.iso3);}}>Guess {mapChoice.name}</Button><Button variant="text" onClick={()=>setMapChoice(null)}>Not now</Button></div></div>:null}
  {state.clue?<div className="gw-clue">{state.clue.label?<p className="t-h3">{state.clue.label}</p>:<svg viewBox={state.clue.viewBox} role="img" aria-label="Outline clue of the hidden country"><path d={state.clue.path} fill="var(--color-ink)"/></svg>}<p className="t-meta text-mute">Outline · −1 guess</p></div>:null}
  <div className="gw-rows" aria-live="polite">{Array.from({length:6},(_,i)=>{
   const clue=state.clueAt===i,guessIndex=state.clueAt!==null&&i>state.clueAt?i-1:i,g=clue?null:state.guesses[guessIndex];
   if(clue)return <div key="clue" className="gw-row gw-empty"><span className="gw-pip"/><span className="t-meta">Outline · −1</span></div>;
   if(!g&&i===used&&pending)return <div className="gw-row gw-pending" key={`pending-${i}`}><div className="gw-country"><Flag iso2={pending.iso2} size="xs" alt="" eager/><span className="t-body">{pending.displayName}</span></div><span className="t-meta text-mute">Checking…</span></div>;
   if(!g)return null;
   return <div key={g.iso3} className={`gw-row gw-heat-${g.band}`}><div className="gw-country"><Flag iso2={g.iso2} size="xs" alt="" eager/><span className="t-body">{g.name}</span></div><div className={`gw-readout${g.sharedBorder?' gw-neighbour':''}`}>
    {g.correct?<><CheckIcon size={24}/><span className="t-meta">Found it</span></>:g.sharedBorder?<><b className="t-body">Neighbour</b><span className="t-meta text-mute">Shared border · 0 km</span></>:<><b className="t-score num">{g.distanceKm===0?'Very close':kmLabel(g.distanceKm)}</b><Arrow bearing={g.bearingDeg} direction={g.direction}/><span className="gw-band t-meta text-mute"><i className="gw-heat-dot" aria-hidden="true"/>{g.distanceKm===0?'Under 1 km':bandLabel(g)}</span>{g.distanceBasis==='centres'?<small className="t-meta text-mute">centre</small>:null}</>}
   </div></div>;
  })}</div>

 </>;
 if(!live)return <details className="gw-history"><summary className="t-body">Your route <span className="t-meta text-mute">{state.guesses.length} {state.guesses.length===1?'guess':'guesses'}</span></summary><div className="gw-board">{history}{source}</div></details>;
 return <div className="gw-board">
  {state.guesses.length===0?<p className="gw-start t-body">Find the hidden country in 6 guesses. Tap the map or type a country.</p>:null}
  {history}
  {state.guesses.length>=2&&state.clueAt===null?<div className="gw-clue-control">{confirmClue?<div className="gw-confirm"><p className="t-body">Outline costs 1 guess.</p><div><Button variant="ink" onClick={e=>{if(e.detail<2){dispatch({t:'clue'});setConfirmClue(false);}}} disabled={busy} pending={busy} pendingLabel="Opening the clue…">Show outline</Button><Button variant="text" onClick={()=>setConfirmClue(false)}>Not now</Button></div></div>:<Button variant="text" onClick={()=>setConfirmClue(true)} disabled={busy}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 5 2 4-1 3 5-2 4 1 5-6 3-5-2-4-5 2-4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"/></svg>Outline · −1 guess</Button>}</div>:null}
  <div className="gw-input" ref={field}><Suggest id="geo-guess" label="Country" hideLabel placeholder="Type a country" value={text} onChange={v=>{setText(v);setMapChoice(null);setError(null);}} items={items} onSelect={item=>{setText(item.name);setMapChoice(null);setError(null);}} onSubmit={submit} autoSelectFirst={false} max={6} error={error} autoComplete="off" autoCapitalize="words" enterKeyHint="go"/><Button variant="ink" onClick={e=>{if(e.detail<2)submit(text);}} disabled={busy||!text.trim()} pending={busy} pendingLabel="Checking…">Guess</Button></div>
  {source}
 </div>;
}
