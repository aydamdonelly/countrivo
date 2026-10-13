import assert from 'node:assert/strict';
import {geography,centroids,sovereignIso3,countries} from '../src/lib/data/loader';
import {mulberry32} from '../src/lib/seeded-random';
import {distanceToCountry,greatCircleKm,borderDistanceKm} from '../src/lib/game-logic/geography';
import {createPinpoint,pinpointView,pinpointPoints,dropPin,nextPinpoint} from '../src/lib/game-logic/pinpoint/engine';
import {gameModule,type PinpointAction} from '../src/games/pinpoint/module';
import {codec} from '../src/games/pinpoint/codec';
const paris={lat:48.8566,lng:2.3522};
assert.equal(distanceToCountry(paris,'FRA')?.inside,true,'Paris lies in France');
assert.equal(distanceToCountry(paris,'FRA')?.km,0,'inside score uses zero border distance');
assert.equal(distanceToCountry({lat:35.68,lng:139.76},'JPN')?.inside,true,'Tokyo lies in Japan');
assert.equal(distanceToCountry({lat:0,lng:0},'JPN')?.inside,false,'ocean point is not inside Japan');
assert.equal(Math.round(greatCircleKm({lat:0,lng:179},{lat:0,lng:-179})),222,'shortest antimeridian distance');
assert.equal(pinpointPoints(25,99),200,'within 25km gets full points regardless of crowding');
assert.equal(pinpointPoints(2000,0),57,'ocean distance penalty cannot award 170');
assert.equal(pinpointPoints(50,7),0,'countries passed penalty reaches zero');
assert.equal(pinpointPoints(3000,0),0,'3000km gets no points');
const bangladeshBhutan=borderDistanceKm("BGD","BTN");assert(bangladeshBhutan!==null&&bangladeshBhutan>=40&&bangladeshBhutan<=60,"Bangladesh and Bhutan are about 50 km apart at their nearest borders");
for(let seed=0;seed<30;seed++){
 let state=createPinpoint(mulberry32(seed));const original=state;
 assert.deepEqual(state,createPinpoint(mulberry32(seed)),'seeded board deterministic');
 assert.equal(new Set(state.countries.map(c=>c.iso3)).size,5,'five distinct countries');
 assert(new Set(state.countries.slice(0,3).map(c=>countries.find(p=>p.iso3===c.iso3)?.region)).size>=3,'early targets span three regions');
 const view=pinpointView(state);
 assert.equal(view.current,null,'no target polygon before drop');assert.equal(view.results.length,0,'no future answers before drop');
 assert(!('countries' in view),'future names are not in the public view');
 assert.equal(dropPin(state,91,0),state,'invalid latitude rejected');
 const log:PinpointAction[]=[];
 for(let round=0;round<5;round++){
  const target=state.countries[state.round],centre=centroids[target.iso3];
  assert(centre&&geography.countries[target.iso3]&&sovereignIso3.includes(target.iso3));
  const action:PinpointAction={t:'drop',lat:Math.round(centre[0]*10000)/10000,lng:Math.round(centre[1]*10000)/10000};
  log.push(action);state=gameModule.reduce(state,action);
  assert.equal(state.phase,'reveal');assert.equal(gameModule.progress(state).current,null,'answered round does not stay marked current');assert(pinpointView(state).current?.path,'committed reveal includes only that country');
  assert.equal(state.results.at(-1)?.points,(state.results.at(-1)?.basePoints??0)*(round===4?2:1),'round five alone doubles');
  assert.equal(gameModule.reduce(state,action),state,'committed pin cannot be changed');
  log.push({t:'next'});state=nextPinpoint(state);
 }
 assert.equal(state.phase,'finished');assert(gameModule.done(state));assert(state.score>=0&&state.score<=1200);
 const replay=codec.dec(codec.enc(log)).reduce(gameModule.reduce,original);
 assert.deepEqual(replay,state,'codec replay keeps scoring and all five pins');
 const payload=gameModule.payload(state,{mode:'daily',dateKey:'2026-10-13',startedAt:'2026-10-13T12:00:00Z'});
 assert.equal(payload.scoreRaw,state.results.reduce((n,r)=>n+r.points,0));assert.equal(payload.scoreMax,1200);
}
assert.throws(()=>codec.dec('dNaN,1;'));assert.throws(()=>codec.dec('d910000,0;'));assert.throws(()=>codec.dec('d0,0'));
console.log("check-pinpoint: geometry, secrecy, scoring and codec checks passed across 30 deterministic five-round boards");
