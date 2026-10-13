import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {gameModule as geo} from '../src/games/geo-wordle/module';
import {gameModule as pinpoint} from '../src/games/pinpoint/module';
import {rotationAnswers,respectsRotation,rotationWindowStart,selectRotationCandidate,type GeographyGame,type GeographyHistory} from '../src/lib/game-logic/geography-rotation';

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
console.log(`check-geography-fairness: 365 days per game passed; largest candidate rejection count ${mostAttempts}. Test history stays in memory.`);
