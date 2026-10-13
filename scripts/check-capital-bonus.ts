import assert from 'node:assert/strict';
import {capitalsAccepted,countries} from '../src/lib/data/loader';
import {capitalBonusChoices,capitalIsAccepted} from '../src/lib/game-logic/geo-wordle/bonus';
import {geoWordleView,type GeoWordleState} from '../src/lib/game-logic/geo-wordle/engine';
import {mulberry32} from '../src/lib/seeded-random';

assert.equal(Object.keys(capitalsAccepted).length,countries.length,'every stored country has an accepted-capital array');
for(const iso3 of ['BOL','ZAF']){
  const accepted=capitalsAccepted[iso3];
  const options=capitalBonusChoices(accepted,mulberry32(7));
  assert.equal(options.length,4);assert.equal(new Set(options).size,4);
  accepted.forEach(city=>{assert(options.includes(city));assert(capitalIsAccepted(accepted,city),`${city} is never marked wrong`);});
  assert(options.some(city=>!capitalIsAccepted(accepted,city)),'multi-capital question has a genuine distractor');
  const state:GeoWordleState={answerIso3:iso3,guesses:[],clueAt:null,phase:'lost'};
  const revealed=geoWordleView(state).answer;
  assert.deepEqual(revealed?.capitalsAccepted,accepted);
  assert(revealed?.capitalSourceUrl.startsWith('https://'),'verified alternatives carry their primary source');
}
assert(capitalIsAccepted(capitalsAccepted.BOL,'La  Paz'));assert(capitalIsAccepted(capitalsAccepted.BOL,'SUCRE'));
assert.equal(capitalIsAccepted(capitalsAccepted.ZAF,'Johannesburg'),false);
assert.equal(capitalIsAccepted(capitalsAccepted.NLD,'The Hague'),false,'government seat is not silently relabelled as the Dutch capital');
assert.equal(capitalIsAccepted(capitalsAccepted.LKA,'Colombo'),false,'commercial capital is not an accepted administrative capital');
for(const iso3 of ['ISR','PSE'])assert.deepEqual(capitalBonusChoices(capitalsAccepted[iso3],mulberry32(1)),[],'disputed capital question is skipped');
for(let seed=0;seed<20;seed++)assert(!capitalBonusChoices(capitalsAccepted.FRA,mulberry32(seed)).includes('Jerusalem'),'disputed capitals never appear as distractors');
console.log('check-capital-bonus: complete arrays, multiple accepted answers, exact capital roles, aliases and disputed-capital exclusions passed');
