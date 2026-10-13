import { mulberry32 } from '@/lib/seeded-random';
import { createPinpoint,dropPin,nextPinpoint,PINPOINT_MAX,PINPOINT_ROUNDS,type PinpointState } from '@/lib/game-logic/pinpoint/engine';
import type { GameModule } from '@/games/types';
import { buildPinpointShareText } from '@/lib/share/pinpoint';
import { codec } from './codec';
export type PinpointAction = {t:'drop';lat:number;lng:number}|{t:'next'};
export const gameModule:GameModule<PinpointState,PinpointAction> = {
 slug:'pinpoint',create(seed){return createPinpoint(mulberry32(seed));},
 reduce(state,action){return action.t==='drop'?dropPin(state,Math.round(action.lat*10000)/10000,Math.round(action.lng*10000)/10000):action.t==='next'?nextPinpoint(state):state;},
 codec,done:state=>state.phase==='finished',
 progress(state){return {done:state.results.length,total:PINPOINT_ROUNDS,label:'score',value:String(state.score),extra:'of 1,200',current:state.phase==='placing'?state.round:null};},
 verdict(prev,next,action){if(prev===next||action.t!=='drop')return null;const r=next.results.at(-1);return r?{tone:r.basePoints>=120?'good':'neutral',text:r.inside?'Inside the country.':`${r.distanceKm} km away.`,delta:`+${r.points}`} : null;},
 payload(state,ctx){return {gameSlug:'pinpoint',mode:ctx.mode,dateKey:ctx.dateKey,scoreRaw:state.score,scoreMax:PINPOINT_MAX,scoreSortValue:state.score,scoreDisplay:`${state.score} of 1,200`,resultJson:{score:state.score,rounds:state.results.map(r=>({iso3:r.iso3,lat:r.lat,lng:r.lng,distanceKm:r.distanceKm,away:r.away,basePoints:r.basePoints,points:r.points,inside:r.inside}))},startedAt:ctx.startedAt};},
 scoreLabel:state=>`${state.score} of 1,200`,share:(state,ctx)=>buildPinpointShareText(state.results,ctx.dateKey),
 keyHint:'Focus map · arrows move · Enter place · Enter drop',keepBoardOnResult:false,submits:true,
};
