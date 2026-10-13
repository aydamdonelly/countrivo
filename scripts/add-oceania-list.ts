import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LISTS, type ListContent } from '../src/content/lists';
import { countries, sovereignIso3 } from '../src/lib/data/loader';

const slug = 'countries-in-oceania';
const count = countries.filter(country => country.continent === 'Oceania' && sovereignIso3.includes(country.iso3)).length;
if (!LISTS.some(list => list.slug === slug)) {
  const list: ListContent = {
    slug,
    metaTitle: 'Countries in Oceania | Complete List with Stats',
    description: 'The sovereign countries of Oceania with flags, capitals, population and area. Practice naming them on a map; territories appear separately.',
    shortName: 'Countries in Oceania',
    h1: 'All Countries in Oceania',
    hubTitle: 'Countries in Oceania',
    hubDescription: 'Sovereign countries, capitals and statistics, with an untimed map quiz.',
    listName: 'All Countries in Oceania',
    listDescription: 'Sovereign countries in Oceania listed by population, with capital and area.',
    numberCaption: 'sovereign countries in Oceania',
    intro: ['Oceania includes Australia and the Pacific countries assigned to this region in Countrivo’s country dataset. Sovereign countries count in the quiz, while territories and other places are listed separately.'],
    quickFacts: [
      {kind:'sum', stat:'population', label:'everyone in Oceania'},
      {kind:'top', stat:'population', label:'the most populous'},
      {kind:'top', stat:'area-km2', label:'the largest'},
      {kind:'bottom', stat:'area-km2', label:'the smallest'},
    ],
    faq: [
      {q:'How many countries are in Oceania?', a:`Countrivo’s sovereign-country dataset assigns ${count} countries to Oceania, including Australia. Territories and other places are listed separately.`},
      {q:'Which countries count in this quiz?', a:'Only the sovereign countries shown in this list. The country set consists of the UN members plus the Holy See and Palestine; regional groupings follow the country dataset.'},
    ],
    source: {kind:'continent', continent:'Oceania', sovereign:count},
    seeAlso: ['countries-in-asia', 'countries-in-africa', 'countries-in-americas', 'countries-in-europe', 'largest-countries'],
  };
  const file = join(process.cwd(), 'src/content/lists.ts');
  const marker = '  {\n    slug: "countries-in-europe",';
  const text = readFileSync(file, 'utf8');
  if (!text.includes(marker)) throw new Error('Continent list insertion point changed');
  writeFileSync(file, text.replace(marker, `  ${JSON.stringify(list, null, 2).replaceAll('\n', '\n  ')},\n${marker}`));
}
console.log(`Oceania list registered with ${count} sovereign countries; sitemap and timestamps derive from LISTS.`);
