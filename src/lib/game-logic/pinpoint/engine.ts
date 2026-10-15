import { countries, capitalsAccepted, geography, sovereignIso3 } from '@/lib/data/loader';
import {CAPITAL_OVERRIDES} from '@/content/capitals';
import { seededShuffle } from '@/lib/seeded-random';
import { distanceToCountry, type GeoPoint } from '@/lib/game-logic/geography';

export const PINPOINT_ROUNDS = 5;
export const PINPOINT_MAX = 1200;
export const PINPOINT_PAR = 720;
export interface PinpointCountry {iso3:string;name:string}
export interface PinpointRoundResult {
 iso3:string;name:string;lat:number;lng:number;distanceKm:number;away:number;
 basePoints:number;points:number;inside:boolean;nearest:GeoPoint;path:string;fact:string;sourceUrl:string;
}
export interface PinpointState {
 countries:PinpointCountry[];round:number;phase:'placing'|'reveal'|'finished';score:number;results:PinpointRoundResult[];
}
export interface PinpointView {
 round:number;country:PinpointCountry;phase:PinpointState['phase'];score:number;
 results:PinpointRoundResult[];current:PinpointRoundResult|null;
 /** A named next target, with no border, coordinates or uncommitted result. */
 nextView?:PinpointView;
}
const LARGE = new Set(['CAN','USA','MEX','BRA','ARG','COL','PER','CHL','VEN','BOL','DZA','AGO','EGY','ETH','ZAF','NGA','KEN','TZA','COD','SDN','MDG','MLI','NER','TCD','MRT','NAM','BWA','ZMB','MOZ','ZWE','RUS','CHN','IND','AUS','KAZ','MNG','IDN','SAU','IRN','PAK','AFG','THA','MMR','VNM','TUR','FRA','ESP','DEU','POL','UKR','SWE','FIN','NOR','GBR','NZL']);
const sovereign = new Set(sovereignIso3);
const pool = countries.filter(c=>sovereign.has(c.iso3)&&geography.countries[c.iso3]);

export function createPinpoint(rng:()=>number):PinpointState {
 const shuffled=seededShuffle(pool,rng);
 const first=shuffled.filter(c=>LARGE.has(c.iso3)).slice(0,3);
 // Region diversity is guaranteed for the first three readable targets.
 const diverse=first.slice(0,1);
 for(const c of shuffled.filter(c=>LARGE.has(c.iso3)))if(!diverse.some(p=>p.region===c.region)&&diverse.length<3)diverse.push(c);
 const chosen=diverse.length===3 ? diverse : first;
 const fourth=shuffled.find(c=>LARGE.has(c.iso3)&&!chosen.some(p=>p.iso3===c.iso3));
 if(fourth)chosen.push(fourth);
 const fifth=shuffled.find(c=>!chosen.some(p=>p.iso3===c.iso3));
 if(fifth)chosen.push(fifth);
 if(chosen.length!==PINPOINT_ROUNDS)throw new Error('Pinpoint needs five mapped countries');
 return {countries:chosen.map(c=>({iso3:c.iso3,name:c.displayName})),round:0,phase:'placing',score:0,results:[]};
}
export function pinpointPoints(distanceKm:number,away:number):number {
 return distanceKm<=25 ? 200 : Math.max(0,Math.min(170-30*away,Math.round(170*(1-distanceKm/3000))));
}
export function dropPin(state:PinpointState,lat:number,lng:number):PinpointState {
 if(state.phase!=='placing'||!Number.isFinite(lat)||!Number.isFinite(lng)||lat< -65||lat>85||lng< -180||lng>180)return state;
 const target=state.countries[state.round],pin={lat,lng};
 const distance=distanceToCountry(pin,target.iso3),shape=geography.countries[target.iso3];
 if(!distance||!shape)return state;
 const away=distance.km<=25?0:pool.filter(c=>c.iso3!==target.iso3).reduce((n,c)=>{const other=distanceToCountry(pin,c.iso3);return n+(other&&other.km<distance.km?1:0);},0);
 const basePoints=pinpointPoints(distance.km,away),points=basePoints*(state.round===4?2:1);
 const country=pool.find(c=>c.iso3===target.iso3);
 const capital=CAPITAL_OVERRIDES[target.iso3];
 const fact=country?`${country.displayName} is in ${country.region=== "Americas" ? "the Americas" : country.region}.${capital?` ${capital.explanation}`:capitalsAccepted[target.iso3]?.length?` Its recorded capital is ${country.capital}.`:''}`:target.name;
 const result:PinpointRoundResult={...target,fact,sourceUrl:capital?.sourceUrl??'/sources#countries',lat,lng,distanceKm:distance.km,away,basePoints,points,inside:distance.inside,nearest:distance.nearest,path:shape.path};
 return {...state,phase:'reveal',score:state.score+points,results:[...state.results,result]};
}
export function nextPinpoint(state:PinpointState):PinpointState {
 if(state.phase!=='reveal')return state;
 return state.round===4?{...state,phase:'finished'}:{...state,round:state.round+1,phase:'placing'};
}
/** Only the named current target and already committed reveals leave the server. */
export function pinpointView(state:PinpointState,preview=true):PinpointView {
 const view:PinpointView={round:state.round,country:state.countries[state.round],phase:state.phase,score:state.score,results:state.results,current:state.phase==='placing'?null:state.results.at(-1)??null};
 if(preview&&state.phase==='reveal'&&state.round<4)view.nextView=pinpointView(nextPinpoint(state),false);
 return view;
}
