import assert from 'node:assert/strict';
import {countryBorders,sovereignIso3} from '../src/lib/data/loader';
import {longestBorderChains} from '../src/lib/data/discovery';
import {surprisingPositions} from '../src/lib/data/surprising';
import {CAPITAL_EXAMPLES} from '../src/content/discovery';
import {getAllCountries,getCountryByIso3} from '../src/lib/data/countries';
import {isSovereign,worldStandings} from '../src/lib/data/world';
import {countryDescription,countryTitle,titleText} from '../src/lib/seo/country-metadata';
import {buildCapsules} from '../src/features/seo/capsules';
import {ordinal} from '../src/lib/utils';
assert.deepEqual([...countryBorders.LIE].sort(),['AUT','CHE'],'Liechtenstein’s source-backed two neighbours');
assert.deepEqual([...countryBorders.UZB].sort(),['AFG','KAZ','KGZ','TJK','TKM'],'Uzbekistan’s source-backed five neighbours');
const chains=longestBorderChains();assert.equal(chains.length,10);
for(const chain of chains){assert.equal(chain.borders,chain.route.length-1);assert.equal(new Set(chain.route).size,chain.route.length);assert(chain.route.every(iso=>sovereignIso3.includes(iso)));for(let i=1;i<chain.route.length;i++)assert(countryBorders[chain.route[i-1]]?.includes(chain.route[i])||countryBorders[chain.route[i]]?.includes(chain.route[i-1]),'every graph step is a recorded land border');}
assert.deepEqual(chains,longestBorderChains(),'graph examples are deterministic');
for(const category of ['population','area-km2','forest-coverage-pct','gdp-per-capita']){const examples=surprisingPositions(category);assert.equal(examples.length,3);assert.equal(new Set(examples.map(e=>e.iso3)).size,3);for(const e of examples){assert(sovereignIso3.includes(e.iso3));assert(e.rank>=1&&e.rank<=e.count);assert(e.comparisonRank>=1&&e.comparisonRank<=e.comparisonCount);}}
assert.equal(CAPITAL_EXAMPLES.length,3);assert(CAPITAL_EXAMPLES.find(c=>c.iso3==='NLD')?.explanation.includes('not make them two constitutional capitals'));
// Country pages: one rank source. The description, the spotlight and the answer capsules all
// read the sovereign-state standings, a territory is never ranked as a country, and the
// title fits a search result.
let countryPages=0;
for(const country of getAllCountries()){
  const standings=worldStandings(country.iso3),sovereign=isSovereign(country.iso3);
  const description=countryDescription(country,standings,sovereign);
  const capsules=buildCapsules(country,standings,[]);
  const has=(slug:string)=>standings.some(row=>row.category.slug===slug);
  const title=countryTitle(country.displayName,{population:has('population'),area:has('area-km2'),capital:Boolean(country.capital)});
  const shown=typeof title==='string'?`${title} | Countrivo`:titleText(title);
  assert(shown.startsWith(`${country.displayName}: Population`)||!has('population'),`${country.slug}: title leads with population`);
  assert(shown.length<=65||country.displayName.length>40,`${country.slug}: title fits 65 characters (${shown.length})`);
  const area=standings.find(row=>row.category.slug==='area-km2');
  const size=capsules.find(c=>c.question.startsWith('How big'));
  for(const row of standings)assert.equal(row.sovereign,sovereign,`${country.slug}: standing flag matches the sovereign set`);
  if(sovereign){
    if(area&&size){assert(description.includes(`${ordinal(area.rank)} by area`),`${country.slug}: description area rank`);assert(size.answer.includes(area.rank===1?'the largest country':`the ${ordinal(area.rank)} largest country`),`${country.slug}: capsule area rank matches the description`);}
  }else{
    assert(!/of \d+ countries(?! and territories)|largest country|largest population|highest of any country/.test(description+capsules.map(c=>c.answer).join(' ')),`${country.slug}: a territory is never ranked as a country`);
    if(area){assert(description.startsWith(`${country.displayName} covers `),`${country.slug}: territory description opens with its area`);assert(size?.answer.includes(`would place ${ordinal(area.rank)}`),`${country.slug}: capsule names where it would place`);}
  }
  countryPages++;
}
const martinique=worldStandings('MTQ').find(row=>row.category.slug==='area-km2');
assert(martinique&&!buildCapsules(getCountryByIso3('MTQ')!,worldStandings('MTQ'),[]).some(c=>c.answer.includes('185th')),'Martinique no longer reads 185th next to 171st');
console.log(`check-discovery: neighbour facts, ${chains.length} valid border chains, ranked contrasts, precise capital roles and ${countryPages} consistent country pages passed`);
