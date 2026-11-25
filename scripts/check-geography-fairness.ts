import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {gameModule as geo} from '../src/games/geo-wordle/module';
import {gameModule as pinpoint} from '../src/games/pinpoint/module';
import {rotationAnswers,respectsRotation,rotationWindowStart,selectRotationCandidate,type GeographyGame,type GeographyHistory} from '../src/lib/game-logic/geography-rotation';
import {gameModule as blind} from '../src/games/blind-pick/module';
import {ANCHOR_STATS,BLIND_PICK_ROTATION_FROM,ROTATING_STATS} from '../src/lib/game-logic/blind-pick/rotation';
import {MAX_GREEDY_GAP,MIN_GREEDY_GAP} from '../src/lib/game-logic/blind-pick/generator';

assert.equal(rotationWindowStart('2026-10-14',45),'2026-08-31');
assert.equal(respectsRotation('geo-wordle','2026-10-14',['FRA'],[{dateKey:'2026-08-30',answers:['FRA']}]),true,'45-day boundary is allowed');
assert.equal(respectsRotation('geo-wordle','2026-10-14',['FRA'],[{dateKey:'2026-08-31',answers:['FRA']}]),false,'44-day-old answer is excluded');
assert.equal(respectsRotation('geo-wordle','2026-10-14',['FRA'],[{dateKey:'2026-10-14',answers:['FRA']}]),true,'today does not become its own exclusion');
const pin=['FRA','USA','KEN','JPN','NZL'];
assert.equal(respectsRotation('pinpoint','2026-10-14',pin,[{dateKey:'2026-10-01',answers:['USA','BRA','ZAF','IND','DEU']}]),false,'opening rounds share the same 14-day band');
assert.equal(respectsRotation('pinpoint','2026-10-14',pin,[{dateKey:'2026-09-30',answers:pin}]),true,'14-day boundary is allowed');
assert.equal(respectsRotation('pinpoint','2026-10-14',pin,[{dateKey:'2026-10-13',answers:['JPN','BRA','ZAF','FRA','DEU']}]),true,'different difficulty bands have separate windows');
assert.throws(()=>rotationAnswers('geo-wordle',{answerIso3:'not-a-country'}));
assert.throws(()=>rotationAnswers('pinpoint',{countries:[{iso3:'FRA'}]}));

let mostAttempts=0;
function simulate<S>(slug:GeographyGame,create:(seed:number)=>S){
  const history:GeographyHistory[]=[];
  for(let day=0;day<365;day++){
    const date=new Date('2026-11-01T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);const dateKey=date.toISOString().slice(0,10);
    const seedForAttempt=(attempt:number)=>createHmac('sha256','fairness-test-fixture-not-a-production-secret').update(`${slug}|${dateKey}|${attempt}`).digest().readUInt32BE(0)>>>1;
    const selected=selectRotationCandidate(slug,dateKey,history,create,seedForAttempt);
    const answers=rotationAnswers(slug,selected.state);
    assert(respectsRotation(slug,dateKey,answers,history),`${slug} satisfies its real accumulated history on ${dateKey}`);
    assert.deepEqual(selected,selectRotationCandidate(slug,dateKey,history,create,seedForAttempt),'the same secret-derived candidate stream and history are deterministic');
    mostAttempts=Math.max(mostAttempts,selected.attempt);
    history.push({dateKey,answers});
  }
}
simulate('geo-wordle',seed=>geo.create(seed,'daily','2026-11-01'));
simulate('pinpoint',seed=>pinpoint.create(seed,'daily','2026-11-01'));

// Blind Pick's content rotation over a year of secret-derived daily seeds: fresh category sets,
// every category in play, and the same difficulty as the frozen nine-statistic pool it replaces.
function blindPickRotation(){
  const sets=new Set<string>(),seen=new Map<string,number>(),gaps:number[]=[],perfect:number[]=[];
  for(let day=0;day<365;day++){
    const date=new Date(`${BLIND_PICK_ROTATION_FROM}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+day);const dateKey=date.toISOString().slice(0,10);
    const seed=createHmac('sha256','fairness-test-fixture-not-a-production-secret').update(`blind-pick|${dateKey}|0`).digest().readUInt32BE(0)>>>1;
    const config=blind.create(seed,'daily',dateKey).g.config,slugs=config.categories.map(c=>c.slug);
    assert.equal(new Set(slugs).size,8,`blind-pick ${dateKey} deals eight distinct statistics`);
    assert(ANCHOR_STATS.every(a=>slugs.includes(a)),`blind-pick ${dateKey} keeps the four anchors`);
    const gap=config.greedyScore-config.optimalScore;
    assert(gap>=MIN_GREEDY_GAP&&gap<=MAX_GREEDY_GAP,`blind-pick ${dateKey} greedy gap ${gap} stays in the difficulty window`);
    gaps.push(gap);perfect.push(config.optimalScore);sets.add([...slugs].sort().join());
    for(const s of slugs)seen.set(s,(seen.get(s)??0)+1);
  }
  const median=(v:number[])=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
  assert(sets.size>=20,`blind-pick deals ${sets.size} distinct category sets in a year`);
  for(const s of ROTATING_STATS){const share=(seen.get(s)??0)/365;assert(share>=0.4&&share<=0.6,`blind-pick ${s} plays on ${Math.round(share*100)}% of days`);}
  assert(median(gaps)>=14&&median(gaps)<=18,`blind-pick median greedy gap ${median(gaps)} stays comparable`);
  // The frozen nine-statistic pool sits at a median perfect score of 289 to 293.
  assert(median(perfect)>=264&&median(perfect)<=322,`blind-pick median perfect score ${median(perfect)} stays within 10% of the nine-statistic pool`);
  return {sets:sets.size,gap:median(gaps),perfect:median(perfect)};
}
const bp=blindPickRotation();
console.log(`check-geography-fairness: 365 days per game passed; largest candidate rejection count ${mostAttempts}. Blind Pick rotation: ${bp.sets} category sets, median gap ${bp.gap}, median perfect ${bp.perfect}. Test history stays in memory.`);
