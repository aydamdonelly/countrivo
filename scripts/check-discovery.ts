import assert from 'node:assert/strict';
import {countryBorders,sovereignIso3} from '../src/lib/data/loader';
import {longestBorderChains} from '../src/lib/data/discovery';
import {surprisingPositions} from '../src/lib/data/surprising';
import {CAPITAL_EXAMPLES} from '../src/content/discovery';
assert.deepEqual([...countryBorders.LIE].sort(),['AUT','CHE'],'Liechtenstein’s source-backed two neighbours');
assert.deepEqual([...countryBorders.UZB].sort(),['AFG','KAZ','KGZ','TJK','TKM'],'Uzbekistan’s source-backed five neighbours');
const chains=longestBorderChains();assert.equal(chains.length,10);
for(const chain of chains){assert.equal(chain.borders,chain.route.length-1);assert.equal(new Set(chain.route).size,chain.route.length);assert(chain.route.every(iso=>sovereignIso3.includes(iso)));for(let i=1;i<chain.route.length;i++)assert(countryBorders[chain.route[i-1]]?.includes(chain.route[i])||countryBorders[chain.route[i]]?.includes(chain.route[i-1]),'every graph step is a recorded land border');}
assert.deepEqual(chains,longestBorderChains(),'graph examples are deterministic');
for(const category of ['population','area-km2','forest-coverage-pct','gdp-per-capita']){const examples=surprisingPositions(category);assert.equal(examples.length,3);assert.equal(new Set(examples.map(e=>e.iso3)).size,3);for(const e of examples){assert(sovereignIso3.includes(e.iso3));assert(e.rank>=1&&e.rank<=e.count);assert(e.comparisonRank>=1&&e.comparisonRank<=e.comparisonCount);}}
assert.equal(CAPITAL_EXAMPLES.length,3);assert(CAPITAL_EXAMPLES.find(c=>c.iso3==='NLD')?.explanation.includes('not make them two constitutional capitals'));
console.log(`check-discovery: neighbour facts, ${chains.length} valid border chains, ranked contrasts and precise capital roles passed`);
