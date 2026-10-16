import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { categories } from '../src/lib/data/public';
import { getAllCategories, getCategoryBySlug } from '../src/lib/data/categories';
import { getAllCountries } from '../src/lib/data/countries';
import { worldStandings } from '../src/lib/data/world';
import { gameModule as higher } from '../src/games/higher-or-lower/module';
import { gameModule as guesser } from '../src/games/stat-guesser/module';
import { gameModule as blind } from '../src/games/blind-pick/module';
import { getList, LISTS, LIST_SLUGS, LIST_SOURCES } from '../src/content/lists';
import type { Category } from '../src/types/category';

const withheld = ['beer-consumption-per-capita', 'coffee-consumption-per-capita', 'wine-consumption-per-capita', 'military-spending-pct'];
const source: Category[] = JSON.parse(readFileSync('src/data/categories.json', 'utf8'));
const retained = source.filter(category => !withheld.includes(category.slug));
assert.deepEqual(categories, retained, 'Published metadata must retain every other category unchanged');
assert.deepEqual(getAllCategories(), retained);
for (const slug of withheld) {
  assert(source.some(category => category.slug === slug), 'Keep historical source metadata');
  assert.equal(getCategoryBySlug(slug), undefined, `${slug} must not resolve to a published category`);
}
for (const name of ['stats', 'ranks']) {
  const rows: Record<string, Record<string, number | null>> = JSON.parse(readFileSync(`src/data/${name}.json`, 'utf8'));
  assert(Object.values(rows).every(row => !Object.hasOwn(row, 'military-spending-pct')), `No SIPRI values may remain in current ${name}`);
}
assert.equal(getList('biggest-military-spenders'), null);
assert(!LIST_SLUGS.includes('biggest-military-spenders'));
assert(!Object.hasOwn(LIST_SOURCES, 'biggest-military-spenders'));
assert(LISTS.every(list => list.source.kind !== 'stat' || !withheld.includes(list.source.category)));
for (const country of getAllCountries()) {
  assert(worldStandings(country.iso3).every(row => !withheld.includes(row.category.slug)));
}
for (let seed = 1; seed <= 12; seed += 1) {
  for (const mode of ['daily', 'practice'] as const) {
    const states = [higher.create(seed, mode, '2026-10-14'), guesser.create(seed, mode, '2026-10-14'), blind.create(seed, mode, '2026-10-14')];
    for (const state of states) {
      const board = JSON.stringify(state);
      assert(withheld.every(slug => !board.includes(slug)), 'New game boards must exclude unverified extracts');
    }
  }
}

async function checkRoutes(base: string) {
  for (const slug of withheld) {
    const response = await fetch(new URL(`/categories/${slug}`, base));
    assert.equal(response.status, 404, `${slug} category route must be unavailable`);
  }
  assert.equal((await fetch(new URL('/lists/biggest-military-spenders', base))).status, 404);
  for (const route of ['/categories', '/countries/france', '/categories/population', '/lists', '/sitemap.xml']) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, `${route} remains available`);
    const html = await response.text();
    assert(withheld.every(slug => !html.includes(`/categories/${slug}`)), `${route} must not link to withheld data`);
    assert(!html.includes('/lists/biggest-military-spenders'), `${route} must not link to the withheld ranking`);
  }
  console.log('Published routes: four withheld statistics and the SIPRI ranking return 404; remaining pages and sitemap are clean.');
}

const base = process.argv.find(argument => argument.startsWith('--base='))?.slice('--base='.length);
if (base) checkRoutes(base).catch(error => { console.error(error); process.exitCode = 1; });
console.log(`Published statistics: ${categories.length} retained categories, 243 country standings and 72 generated game boards checked.`);
