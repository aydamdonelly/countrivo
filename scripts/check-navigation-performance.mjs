import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
const out = '.check-render/performance';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const measurements = [];
const dailyCount = JSON.parse(readFileSync('src/data/game-registry.json', 'utf8')).filter(game => game.availableModes?.includes('daily')).length;
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    let blockedPosts = 0;
    await page.route('**/*', route => {
      if (route.request().method() === 'POST') {blockedPosts++; return route.abort('blockedbyclient');}
      return route.continue();
    });
    const warmed = page.waitForResponse(response => response.url().includes('/games/country-draft/play') && response.request().headers().rsc === '1' && !response.request().headers()['next-router-prefetch']);
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await warmed;
    console.log(`${width}px: active game prefetch observed`);
    const tiles = page.locator('.daily-game-grid .game-tile');
    assert.equal(await tiles.count(), dailyCount, `All ${dailyCount} daily games must be present (from the registry)`);
    const columns = await page.locator('.daily-game-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width < 768 ? 2 : width < 1024 ? 3 : 4, 'Games use two phone columns and four desktop columns');
    const firstRowVisible = await tiles.first().evaluate(tile => tile.getBoundingClientRect().bottom <= innerHeight);
    assert(firstRowVisible, 'The lead game card is fully visible in the first viewport');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'The page fits its viewport');
    const openedAt = performance.now();
    await page.getByRole('link', {name:'Play Country Draft', exact:true}).click();
    await page.getByRole('heading', {name:'Pick a country', exact:true}).waitFor();
    const navigationMs = Math.round(performance.now() - openedAt);
    assert(navigationMs < 1200, `Prefetched navigation took ${navigationMs}ms at ${width}px`);
    assert.equal(await page.locator('.dr-country-card').count(), 3, 'Country Draft starts directly on its three country choices');
    assert.equal(await page.locator('.dr-help-details[open]').count(), 0, 'Rules are optional and closed on entry');
    measurements.push({width, columns, navigationMs, blockedPosts});
    console.log(`${width}px: ${dailyCount} games, ${columns} columns; game opened in ${navigationMs}ms; no rulewall or moves sent`);
    await context.close();
  }
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage();
  await page.route('**/*', route => route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue());
  // 25 November 2026: practice lives once, on /practice, not as a bar under every home tile.
  await page.goto(`${base}/practice`, {waitUntil:'networkidle'});
  const practice = page.getByRole('link', {name:'Play GeoWordle', exact:true});
  const prefetched = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/games/geo-wordle/play' && url.searchParams.get('mode') === 'practice' && response.request().headers().rsc === '1' && !response.request().headers()['next-router-prefetch'];
  });
  await practice.focus();
  // Next can leave a consumed Flight stream open; the real click below proves the cache is usable.
  await prefetched;
  let clickRscRequests = 0;
  page.on('request', request => {
    const url = new URL(request.url());
    if(url.pathname === '/games/geo-wordle/play' && url.searchParams.get('mode') === 'practice' && request.headers().rsc === '1')clickRscRequests++;
  });
  const openedAt = performance.now();
  await practice.press('Enter');
  await page.locator('.gw-map').waitFor();
  await page.getByRole('combobox', {name:'Country', exact:true}).waitFor();
  const navigationMs = Math.round(performance.now() - openedAt);
  assert(navigationMs < 1200, `Intent-prefetched GeoWordle practice took ${navigationMs}ms`);
  assert.equal(clickRscRequests, 0, 'Keyboard intent cached the full dynamic payload: click needs no RSC round trip');
  measurements.push({width:390,kind:'keyboard-intent-geowordle-practice',navigationMs,clickRscRequests});
  console.log(`390px: keyboard intent warmed full GeoWordle practice; opened in ${navigationMs}ms.`);
  await context.close();
  writeFileSync(`${out}/navigation.json`, JSON.stringify(measurements, null, 2) + '\n');
} finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
process.exit(0);
