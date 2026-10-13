import assert from 'node:assert/strict';
import {gameModule} from '../src/games/stat-guesser/module';
import {retargetStatPractice,retargetStatForPractice,valueOf} from '../src/lib/game-logic/stat-guesser/engine';
const original=gameModule.create(731,'practice','2026-10-13');
for(const iso3 of ['ITA','AUS','JAM','USA','CHN','DEU']){
 const state=retargetStatPractice(original,iso3,['population']);
 assert.notEqual(state,original,'available country creates a practice round');
 const index=state.rounds.findIndex((r,i)=>r!==original.rounds[i]);assert(index>=0);
 const round=state.rounds[index];assert.equal(round.country.iso3,iso3);
 assert.notEqual(round.stat,'population','protected daily tuple is unavailable in practice');
 assert(!round.refs.some(ref=>ref.iso3===iso3),'country is never visible as its own reference answer');
 assert.equal(round.actualValue,valueOf(iso3,round.stat),'country value is loaded from recorded data');
 assert.equal(state.rounds.length,5);assert(state.rounds.every((r,i)=>i===index||r===original.rounds[i]),'other rounds stay unchanged');
 assert.deepEqual(retargetStatPractice(original,iso3,['population']),state,'targeting is deterministic');
}
assert.equal(retargetStatPractice(original,'ZZZ'),original,'unknown country is ignored');
assert.equal(retargetStatPractice(original,'GRL'),original,'territory cannot enter the sovereign-country pool');
assert.equal(original.guesses.every(g=>g===null),true,'original state is unchanged');
console.log('check-stat-practice: country selection, daily-tuple exclusion, reference protection and pure targeting passed');

const fixed=retargetStatForPractice(original,"population",["ITA","USA"]);
assert(fixed.rounds.every(r=>r.stat==="population"));
assert.equal(new Set(fixed.rounds.map(r=>r.country.iso3)).size,5);
assert(fixed.rounds.every(r=>!["ITA","USA"].includes(r.country.iso3)),"daily country/stat tuples are excluded from selected-stat practice");
assert(fixed.rounds.every(r=>!r.refs.some(ref=>ref.iso3===r.country.iso3)));
