// Local synthetic acknowledgements exercise slow/offline recovery without writing game runs.
// Run: PLAYWRIGHT_MODULE=/installed/playwright-core/index.mjs node --import tsx scripts/check-instant-map-draft.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { createGame, openCountry, appoint } = require('../src/lib/game-logic/country-draft/engine.ts');
const { draftView } = require('../src/lib/game-logic/country-draft/public-view.ts');
const { createPinpoint, dropPin, pinpointView } = require('../src/lib/game-logic/pinpoint/engine.ts');
const { mulberry32 } = require('../src/lib/seeded-random.ts');
const { gameModule: geoModule } = require('../src/games/geo-wordle/module.ts');
const { geoWordleView } = require('../src/lib/game-logic/geo-wordle/engine.ts');
const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const draft = draftView(appoint(openCountry(createGame(31), 0), 0, 0));
const pinpoint = pinpointView(dropPin(createPinpoint(mulberry32(31)), 0, 0));
let checks = 0;
const latencies = [];
function check(ok, label) { assert(ok, label); checks++; }
function respond(route, view, revision, success = true) {
  return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify({ success, view, revision, sessionToken: `fixture-${revision}`, ...(success ? {} : { error: 'Move was not saved.' }) })}\n` });
}

try {
  for (const slug of ['country-draft', 'pinpoint']) {
    for (const outcome of ['success', 'failure', 'stale', 'network']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const reveal = slug === 'country-draft' ? draft : pinpoint;
      const next = reveal.nextView;
      check(next, `${slug} fixture has an immediate public next stage`);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let posts = 0;
      await page.route('**/*', async route => {
        if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
        posts++;
        if (posts === 1) return respond(route, reveal, 1);
        if (posts === 3) return respond(route, next, 2);
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (outcome === 'network') return route.abort('failed');
        return respond(route, outcome === 'success' ? next : reveal, outcome === 'success' ? 2 : 1, outcome !== 'failure');
      });
      await page.goto(`${base}/games/${slug}/play?mode=practice`, { waitUntil: 'networkidle' });
      if (slug === 'country-draft') {
        await page.locator('.dr-country-card').first().click();
        await page.locator('.dr-pinned-action button').click();
      } else {
        await page.locator('.pp-map').click({ position: { x: 100, y: 100 } });
        await page.getByRole('button', { name: 'Drop pin', exact: true }).click();
      }
      const nextButton = page.getByRole('button', { name: slug === 'country-draft' ? 'Next country' : 'Next', exact: true });
      await nextButton.waitFor();
      const scoreSelector = slug === 'country-draft' ? '.dr-header-score' : '.prog';
      const score = await page.locator(scoreSelector).textContent();
      await nextButton.evaluate(element => element.addEventListener('click', () => { document.documentElement.dataset.nextClickedAt = String(performance.now()); }, { once: true }));
      await nextButton.click();
      const selector = slug === 'country-draft' ? '.dr-country-card .t-h3' : '.pp-heading .t-big';
      const marker = slug === 'country-draft' ? next.countries[0].name : next.country.name;
      await page.waitForFunction(({ selector, marker }) => {
        if (document.querySelector(selector)?.textContent === marker) {
          document.documentElement.dataset.nextLatency = String(performance.now() - Number(document.documentElement.dataset.nextClickedAt));
          return true;
        }
        return false;
      }, { selector, marker });
      const latency = Number(await page.locator('html').getAttribute('data-next-latency'));
      check(latency < 150, `${slug}/${outcome}: immediate stage took ${latency.toFixed(1)} ms`);
      latencies.push(latency);
      check(await page.locator(scoreSelector).textContent() === score, 'No score/pip advances before acknowledgement');
      if (slug === 'country-draft') {
        check(await page.locator('.dr-person-card').count() === 0, 'Unopened people stay hidden in preview');
        await page.locator('.dr-country-card').first().click();
        check(await page.locator('.dr-country-card').first().getAttribute('aria-pressed') === 'true', 'Next country is locally selectable during persistence');
        check(await page.locator('.dr-pinned-action button').isDisabled(), 'Cannot open a country before prior acknowledgement');
        await page.keyboard.press('Enter');
      } else {
        check(await page.locator('.pp-feedback').count() === 0 && await page.locator('.pp-route').count() === 0, 'Next target border and score stay hidden');
        await page.locator('.pp-map').click({ position: { x: 150, y: 120 } });
        check(await page.locator('.pp-map .pp-dropped').count() === 0, 'Locally selected pin is not presented as a committed drop');
        check(await page.locator('.pp-action button').isDisabled(), 'Cannot commit another pin before prior acknowledgement');
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(60);
      check(posts === 2, 'Repeated input cannot race a pending commit');
      if (outcome === 'success') {
        await page.waitForFunction(selector => !document.querySelector(selector)?.disabled, slug === 'country-draft' ? '.dr-pinned-action button' : '.pp-action button');
        check(await page.locator(selector).first().textContent() === marker, 'Successful acknowledgement preserves next stage');
        if (slug === 'country-draft') check(await page.locator('.dr-country-card').first().getAttribute('aria-pressed') === 'true', 'Acknowledgement preserves local country choice');
        else check(await page.getByRole('button', { name: 'Drop pin', exact: true }).isEnabled(), 'Acknowledgement preserves the locally placed pin');
      } else {
        await nextButton.waitFor();
        check(await nextButton.isEnabled(), 'Failure or stale response restores canonical reveal');
        if (outcome !== 'stale') {
          const retry = page.getByRole('button', { name: 'Try again', exact: true });
          await retry.click();
          await page.waitForFunction(({ selector, marker }) => document.querySelector(selector)?.textContent === marker, { selector, marker });
          check(posts === 3, 'Retry sends the same unconfirmed action once');
          check(await page.locator('.session-notice [role="alert"]').count() === 0, 'A confirmed retry clears the connection error');
        }
      }
      check(errors.length === 0, `No runtime errors: ${errors.join('; ')}`);
      console.log(`${slug}/${outcome}: next stage ${latency.toFixed(1)} ms with a 1,200 ms response delay`);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  let posts = 0;
  const requests = [];
  const guessed = geoWordleView(geoModule.reduce(geoModule.create(31, 'practice', '2026-10-13'), { t: 'guess', iso3: 'NOR' }));
  await page.route('**/*', async route => {
    if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
    requests.push(route.request().postData()); posts++;
    if (posts === 1) return route.abort('failed');
    return respond(route, guessed, 1);
  });
  await page.goto(`${base}/games/geo-wordle/play?mode=practice`, { waitUntil: 'networkidle' });
  await page.locator('.gw-input input').fill('Norway');
  await page.getByRole('button', { name: 'Guess', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await retry.waitFor();
  check(await page.locator('.gw-row:not(.gw-pending)').count() === 0, 'A failed guess cannot fabricate a distance or direction');
  await retry.click();
  await page.locator('.gw-row:not(.gw-pending)').waitFor();
  check(posts === 2 && requests[0] === requests[1], 'Retry preserves the original guess, session token and revision after a lost acknowledgement');
  check(await page.locator('.gw-row:not(.gw-pending)').count() === 1, 'Retried guess occupies exactly one attempt');
  check(await page.locator('.session-notice [role="alert"]').count() === 0, 'Recovered GeoWordle clears its connection error');
  await context.close();
  console.log(`Instant map/draft: ${checks} checks passed; ${Math.min(...latencies).toFixed(1)}–${Math.max(...latencies).toFixed(1)} ms next-stage response; no runs written.`);
} finally { await browser.close(); }
