import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
const out = '.check-render/performance';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const measurements = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    let posts = 0;
    page.on('request', request => {
      if (request.method() === 'POST' && request.headers()['next-action']) posts++;
    });
    const warmed = page.waitForResponse(response => response.url().includes('/games/country-draft/play') && response.request().headers().rsc === '1');
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await warmed;
    console.log(`${width}px: active game prefetch observed`);
    const tiles = page.locator('.daily-game-grid .game-tile');
    assert.equal(await tiles.count(), 6, 'All six daily games must be present');
    const columns = await page.locator('.daily-game-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width < 768 ? 2 : 3, 'Games use two phone columns and three desktop columns');
    const belowFold = await tiles.evaluateAll(tiles => tiles.filter(tile => tile.getBoundingClientRect().bottom > innerHeight).length);
    assert.equal(belowFold, 0, 'All six games must be visible without swiping at the tested height');
    const openedAt = performance.now();
    await page.getByRole('link', {name:'Play Country Draft', exact:true}).click();
    await page.getByRole('heading', {name:'Pick a country', exact:true}).waitFor();
    const navigationMs = Math.round(performance.now() - openedAt);
    assert(navigationMs < 1200, `Prefetched navigation took ${navigationMs}ms at ${width}px`);
    assert.equal(await page.locator('.dr-country-card').count(), 3, 'Country Draft starts directly on its three country choices');
    assert.equal(await page.locator('.dr-help-details[open]').count(), 0, 'Rules are optional and closed on entry');
    assert.equal(posts, 0, 'Read-only navigation must not send moves');
    measurements.push({width, columns, navigationMs});
    console.log(`${width}px: six games visible, ${columns} columns; game opened in ${navigationMs}ms; no rulewall or moves sent`);
    await context.close();
  }
  writeFileSync(`${out}/navigation.json`, JSON.stringify(measurements, null, 2) + '\n');
} finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
process.exit(0);
