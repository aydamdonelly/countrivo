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
    await page.route('**/*', route => {
      if (route.request().method() === 'POST') { posts++; return route.abort(); }
      return route.continue();
    });
    const warmed = page.waitForResponse(response => response.url().includes('/games/country-draft/play') && response.request().headers().rsc === '1');
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await (await warmed).finished();
    console.log(`${width}px: active game prefetch observed`);
    const switchedAt = performance.now();
    await page.getByRole('button', { name: 'Stat Guesser', exact: true }).click();
    await page.waitForFunction(() => {
      const deck = document.querySelector('.game-deck');
      const card = document.querySelector('[data-game="stat-guesser"]');
      const frame = deck.getBoundingClientRect(), selected = card.getBoundingClientRect();
      return card.querySelector('[data-active="true"]') && selected.left >= frame.left - 1 && selected.right <= frame.right + 1;
    });
    const deckMs = Math.round(performance.now() - switchedAt);
    assert(deckMs < 500, `Card switch took ${deckMs}ms at ${width}px`);
    await page.getByRole('button', { name: 'Country Draft', exact: true }).click();
    await page.locator('[data-game="country-draft"] [data-active="true"]').waitFor();
    const openedAt = performance.now();
    await page.locator('[data-game="country-draft"] .tray-play').click();
    await page.getByRole('heading', { name: 'How Country Draft works', exact: true }).waitFor();
    const navigationMs = Math.round(performance.now() - openedAt);
    assert(navigationMs < 1000, `Prefetched navigation took ${navigationMs}ms at ${width}px`);
    await page.getByRole('button', { name: 'Got it', exact: true }).click();
    assert.equal(await page.locator('.dr-country-card').count(), 3, 'The first board must be interactive after the rules close');
    assert.equal(posts, 0, 'Read-only navigation must not send moves');
    measurements.push({ width, deckMs, navigationMs });
    console.log(`${width}px: selected card fully visible in ${deckMs}ms; warmed game opened in ${navigationMs}ms; no moves sent`);
    await context.close();
  }
  writeFileSync(`${out}/navigation.json`, JSON.stringify(measurements, null, 2) + '\n');
} finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
process.exit(0);
