import Link from 'next/link';
import {useMemo,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {coastline} from '@/lib/data/coastline';
import {projectPoint,unprojectPoint,type MapPoint} from '@/lib/game-logic/map-projection';
import type {PinpointRoundResult,PinpointView} from '@/lib/game-logic/pinpoint/engine';
import type {PinpointAction} from './module';
import {Button} from '@/ui/button';
import './pinpoint.css';

interface BoardProps {state:PinpointView;dispatch:(action:PinpointAction)=>void;busy:boolean;commitBusy?:boolean}
interface Viewport {x:number;y:number;zoom:number}
interface Gesture {x:number;y:number;mapUnitsPerPixel:number;viewport:Viewport;dragged:boolean;dragPin:boolean}
interface MapView {round:number;phase:PinpointView['phase'];viewport:Viewport}
const WORLD_VIEW:Viewport={x:360,y:150,zoom:1};
function kmLabel(n:number):string{return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')} km`;}

/** Only the already committed outline and pin determine the reveal framing. */
export function revealViewport(result:PinpointRoundResult):Viewport {
 const points=[projectPoint(result),projectPoint(result.nearest)];
 for(const pair of result.path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g))points.push({x:Number(pair[1]),y:Number(pair[2])});
 const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const width=Math.min(720,Math.max(36,maxX-minX+32,(maxY-minY+24)*2));
 const height=width/2;
 return {x:Math.max(width/2,Math.min(720-width/2,(minX+maxX)/2)),y:Math.max(height/2,Math.min(300-height/2,(minY+maxY)/2)),zoom:720/width};
}

export function pinpointExplanation(result:PinpointRoundResult):string {
 if(result.inside)return `Your pin landed inside ${result.name}.`;
 if(result.distanceKm<=25)return `Your pin was ${kmLabel(result.distanceKm)} from ${result.name}, within the 25 km full-score zone.`;
 return `Your pin was ${kmLabel(result.distanceKm)} from ${result.name}; ${result.away} ${result.away===1?'country was':'countries were'} closer.`;
}

function Pin({point,className,zoom}:{point:MapPoint;className?:string;zoom:number}) {
 const p=projectPoint(point);
 return <g transform={`translate(${p.x} ${p.y}) scale(${2/zoom})`}><g className={className}><path d="M0 0s-7-8-7-13a7 7 0 1 1 14 0C7-8 0 0 0 0Z" fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth="1"/><circle cy="-13" r="2.5" fill="var(--color-paper)"/></g></g>;
}

export function Board({state,dispatch,busy,commitBusy=busy}:BoardProps) {
 const [pin,setPin]=useState<MapPoint|null>(null),[crosshair,setCrosshair]=useState<MapPoint>({lat:15,lng:0});
 const [mapView,setMapView]=useState<MapView|null>(null),[placedRound,setPlacedRound]=useState(state.round);
 const svg=useRef<SVGSVGElement>(null),gesture=useRef<Gesture|null>(null);
 const pointers=useRef(new Map<number,{x:number;y:number}>()),pinch=useRef<{distance:number;viewport:Viewport}|null>(null);
 const reveal=state.current;
 const defaultView=useMemo(()=>reveal?revealViewport(reveal):WORLD_VIEW,[reveal]);
 const viewport=mapView?.round===state.round&&mapView.phase===state.phase?mapView.viewport:defaultView;
 const currentPin=placedRound===state.round?pin:null;
 function setViewport(update:Viewport|((previous:Viewport)=>Viewport)) {
  setMapView(previous=>({round:state.round,phase:state.phase,viewport:typeof update==='function'?update(previous?.round===state.round&&previous.phase===state.phase?previous.viewport:defaultView):update}));
 }
 function place(point:MapPoint){setPlacedRound(state.round);setPin(point);setCrosshair(point);}
 function locate(clientX:number,clientY:number){const matrix=svg.current?.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());return {x:p.x,y:p.y};}
 function zoom(amount:number){setViewport(v=>{const focus=!reveal&&currentPin?projectPoint(currentPin):null;return {x:focus?.x??v.x,y:focus?.y??v.y,zoom:Math.max(1,Math.min(20,v.zoom*amount))};});}
 function pointerDown(e:PointerEvent<SVGSVGElement>) {
  if(busy)return;
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.current?.setPointerCapture(e.pointerId);
  if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];pinch.current={distance:Math.hypot(a.x-b.x,a.y-b.y),viewport};gesture.current=null;return;}
  const p=locate(e.clientX,e.clientY),matrix=svg.current?.getScreenCTM();if(!p||!matrix)return;
  if(!reveal)svg.current?.focus();
  const selected=!reveal&&currentPin?projectPoint(currentPin):null;
  gesture.current={x:e.clientX,y:e.clientY,mapUnitsPerPixel:1/matrix.a,viewport,dragged:false,dragPin:!!selected&&Math.hypot(p.x-selected.x,p.y-selected.y)<22/viewport.zoom};
 }
 function pointerMove(e:PointerEvent<SVGSVGElement>) {
  if(pointers.current.has(e.pointerId))pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch.current&&pointers.current.size===2){const [a,b]=[...pointers.current.values()],initial=pinch.current;setViewport({...initial.viewport,zoom:Math.max(1,Math.min(20,initial.viewport.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,initial.distance)))});return;}
  const g=gesture.current;if(!g||busy)return;const p=locate(e.clientX,e.clientY);if(!p)return;
  if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<4&&!g.dragged)return;g.dragged=true;
  if(g.dragPin&&!reveal)place(unprojectPoint(p.x,p.y));
  else setViewport({...g.viewport,x:Math.max(0,Math.min(720,g.viewport.x-(e.clientX-g.x)*g.mapUnitsPerPixel)),y:Math.max(0,Math.min(300,g.viewport.y-(e.clientY-g.y)*g.mapUnitsPerPixel))});
 }
 function pointerUp(e:PointerEvent<SVGSVGElement>) {
  pointers.current.delete(e.pointerId);
  if(pinch.current){if(!pointers.current.size)pinch.current=null;gesture.current=null;return;}
  const g=gesture.current;gesture.current=null;if(!g||g.dragged||reveal||busy)return;
  const p=locate(e.clientX,e.clientY);if(p)place(unprojectPoint(p.x,p.y));
 }
 function keyboard(e:KeyboardEvent<SVGSVGElement>) {
  if(busy||reveal)return;
  if(e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();return;}
  const step=e.shiftKey?0.1:1;let point:MapPoint|null=null;
  if(e.key==='ArrowUp')point={...crosshair,lat:Math.min(85,crosshair.lat+step)};
  if(e.key==='ArrowDown')point={...crosshair,lat:Math.max(-65,crosshair.lat-step)};
  if(e.key==='ArrowLeft')point={...crosshair,lng:crosshair.lng<= -180?180:crosshair.lng-step};
  if(e.key==='ArrowRight')point={...crosshair,lng:crosshair.lng>=180? -180:crosshair.lng+step};
  if(point){e.preventDefault();setCrosshair(point);if(currentPin)place(point);setViewport(v=>{const p=projectPoint(point),halfWidth=360/v.zoom,halfHeight=180/v.zoom;return Math.abs(p.x-v.x)>halfWidth||Math.abs(p.y-v.y)>halfHeight?{...v,x:p.x,y:p.y}:v;});return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(currentPin&&!commitBusy)dispatch({t:'drop',lat:Math.round(currentPin.lat*10000)/10000,lng:Math.round(currentPin.lng*10000)/10000});else if(!currentPin)place(crosshair);}
  if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.7);}
  if(e.key==='-'){e.preventDefault();zoom(1/1.7);}
 }
 const w=720/viewport.zoom,h=360/viewport.zoom;
 const target=reveal?projectPoint(reveal.nearest):null,source=reveal?projectPoint(reveal):null;
 return <div className="pp-board">
  <div className="pp-heading"><p className="t-meta text-mute">{reveal?'Your result':'Find this country'}</p><h2 className="t-big">{state.country.name}</h2>{state.round===4?<span className="pp-multiplier t-meta" aria-label="This round counts double">×2</span>:null}</div>
  <div className="pp-map-wrap">
   <svg ref={svg} className="pp-map" viewBox={`${viewport.x-w/2} ${viewport.y-h/2} ${w} ${h}`} role={reveal?'img':'application'} aria-label={reveal?`Your pin and ${state.country.name} highlighted. ${pinpointExplanation(reveal)}`:'World map. Tap to place a pin. Arrow keys move the crosshair. Enter places, then drops. Plus and minus zoom.'} tabIndex={reveal?-1:0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={e=>{pointers.current.delete(e.pointerId);gesture.current=null;pinch.current=null;}} onDoubleClick={()=>zoom(2)} onKeyDown={keyboard} onWheel={e=>{e.preventDefault();zoom(e.deltaY<0?1.2:1/1.2);}}>
    <path className="pp-coast" d={coastline.land} vectorEffect="non-scaling-stroke"/>
    {reveal?<g><path className="pp-answer-land" d={reveal.path} vectorEffect="non-scaling-stroke"/>
     {target&&source&&Math.abs(source.x-target.x)<360?<line className="pp-route" x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--color-ink)" strokeWidth={1.5/viewport.zoom} strokeDasharray={`${4/viewport.zoom} ${3/viewport.zoom}`}/>:null}
     {target&&!reveal.inside?<g className="pp-target" transform={`translate(${target.x} ${target.y})`}><circle r={6/viewport.zoom} fill="var(--color-paper)" stroke="var(--color-ember)" strokeWidth={2/viewport.zoom}/><circle r={2/viewport.zoom} fill="var(--color-ember)"/></g>:null}
     <Pin point={reveal} className="pp-dropped" zoom={viewport.zoom}/>
    </g>:currentPin?<Pin point={currentPin} zoom={viewport.zoom}/>:<g className="pp-crosshair" transform={`translate(${projectPoint(crosshair).x} ${projectPoint(crosshair).y})`} stroke="var(--color-ink)" strokeWidth={1/viewport.zoom}><path d={`M${-8/viewport.zoom} 0h${16/viewport.zoom}M0 ${-8/viewport.zoom}v${16/viewport.zoom}`}/></g>}
   </svg>
   <div className="pp-zoom"><button type="button" onClick={()=>zoom(1.7)} aria-label="Zoom in" disabled={viewport.zoom>=20}>+</button><button type="button" onClick={()=>zoom(1/1.7)} aria-label="Zoom out" disabled={viewport.zoom<=1}>−</button><button type="button" onClick={()=>setViewport(WORLD_VIEW)} aria-label="Reset world view"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M4 12h16M12 4c-5 5-5 11 0 16M12 4c5 5 5 11 0 16" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>{reveal?<button type="button" onClick={()=>setViewport(defaultView)} aria-label="Fit country and your pin"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>:null}</div>
  </div>
  {reveal?<>
   <div className="pp-legend t-meta"><span><i className="pp-legend-pin" aria-hidden="true"/>Your pin</span><span><i className="pp-legend-land" aria-hidden="true"/>{state.country.name}</span>{!reveal.inside?<span><i className="pp-legend-border" aria-hidden="true"/>Nearest border</span>:null}</div>
   <div className="pp-feedback" role="status"><div className="pp-score"><div><h3 className="t-h3">{reveal.inside?'Inside the country':reveal.distanceKm<=25?'Close enough for full points':`${kmLabel(reveal.distanceKm)} away`}</h3><p className="t-body">{pinpointExplanation(reveal)}</p></div><b className="t-score num">+{reveal.points}</b></div>{state.round===4?<p className="t-meta text-mute">{reveal.basePoints} points × 2 for the last round</p>:null}</div>
  </>:<span className="sr-only" role="status">{currentPin?`Pin at ${currentPin.lat.toFixed(1)}°, ${currentPin.lng.toFixed(1)}°. Drag to adjust, then choose Drop pin.`:'Tap the map to place a pin.'}</span>}
  <div className="pp-action">{reveal?<Button variant="ink" pending={commitBusy} pendingLabel="Next country…" onClick={e=>{if(e.detail>1)return;dispatch({t:'next'});setPin(null);}} disabled={commitBusy}>{state.round===4?'Result':'Next'}</Button>:<Button variant="ink" disabled={!currentPin||commitBusy} pending={commitBusy} pendingLabel={busy?'Pin dropped…':'Opening…'} onClick={e=>{if(e.detail<2&&currentPin)dispatch({t:'drop',lat:Math.round(currentPin.lat*10000)/10000,lng:Math.round(currentPin.lng*10000)/10000});}}>{currentPin?'Drop pin':'Tap to place pin'}</Button>}</div>
  {reveal?<details className="pp-detail"><summary className="t-meta">About {state.country.name}</summary><p className="t-body">{reveal.fact}</p><a className="t-meta text-mute" href={reveal.sourceUrl} target="_blank" rel="noreferrer">Geography source</a><p className="t-meta text-mute">Approximate border distance · Natural Earth 1:50m</p></details>:<details className="pp-detail"><summary className="t-meta">Map controls</summary><p className="t-body">Tap to place. Drag to move the map or pin. Pinch or use + / − to zoom.</p><p className="t-meta text-mute">Keyboard: arrows to move, Enter to place and drop. Shift + arrows for a smaller step.</p></details>}
  <noscript><p className="t-body">Pinpoint needs JavaScript to place a pin.</p><Link href="/games">Try another geography game</Link></noscript>
 </div>;
}
