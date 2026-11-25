// The leaderboard flag picker ships the 195 sovereign countries with the page, so the sheet
// opens without a server round trip. Regenerate after countries.json or sovereign.json change:
//   node scripts/build-flag-places.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dataRoot = new URL('../src/data/', import.meta.url);
const countries = JSON.parse(readFileSync(new URL('countries.json', dataRoot), 'utf8'));
const sovereign = new Set(JSON.parse(readFileSync(new URL('sovereign.json', dataRoot), 'utf8')));
const places = countries
  .filter(country => sovereign.has(country.iso3))
  .map(country => ({ iso3: country.iso3, iso2: country.iso2, name: country.displayName }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));
if (places.length !== sovereign.size) throw new Error(`Expected ${sovereign.size} sovereign countries, found ${places.length}.`);
writeFileSync(new URL('flag-places.json', dataRoot), JSON.stringify(places) + '\n');
console.log(`flag-places.json: ${places.length} countries`);
