// Acknowledgements are local fixtures: this verifies UI decisions without writing runs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { createGame, openCountry, appoint, nextRound } = require('../src/lib/game-logic/country-draft/engine.ts');
const { draftView } = require('../src/lib/game-logic/country-draft/public-view.ts');
const { cabinetStory } = require('../src/games/country-draft/presentation.ts');
const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local fixtures only.');
const initial = createGame(31);
const people = draftView(openCountry(initial, 0));
let completed = initial;
for (let round = 0; round < 5; round++) {
  const pick = initial.board.best[round];
  completed = appoint(openCountry(completed, pick.countryIdx), pick.poolIdx, pick.seat);
  if (round < 4) completed = nextRound(completed);
}
const seated = draftView(completed);
const done = draftView(nextRound(completed), true);
const story = cabinetStory(done.seats);
let checks = 0;
const check = (ok, label) => { assert(ok, label); checks++; };
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const output = '.check-render/draft-presentation';
mkdirSync(output, { recursive: true });
try {
  for (const width of [320, 390, 1440]) for (const reducedMotion of ['reduce', 'no-preference']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let posts = 0;
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
      const view = [people, seated, done, draftView(initial)][Math.min(posts++, 3)];
      return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify({ success: true, view, revision: posts, sessionToken: `presentation-${posts}` })}\n` });
    });
    await page.goto(`${base}/games/country-draft/play?mode=practice`, { waitUntil: 'networkidle' });
    await page.locator('.dr-country-card').first().click();
    await page.locator('.dr-person-select').first().click();
    const options = page.locator('.dr-job-options');
    check(await options.getByText('Seat as Science & ideas', { exact: true }).count() === 1, 'Science meaning is visible at the decision');
    check(await options.getByText('Science, invention and exploration', { exact: true }).count() === 1, 'Neutral role description includes exploration');
    check(!/\b(?:fit|fame|points|natural|strong|thin|\d+)\b/i.test(await options.innerText()), 'Role options reveal no individual points or fit');
    await options.getByRole('button', { name: /^Seat as Leader/ }).click();
    await page.getByRole('button', { name: 'Reveal my cabinet', exact: true }).click();
    await page.locator('.dr-result-card').waitFor();
    check(await page.getByRole('button', { name: 'Share my cabinet', exact: true }).isEnabled(), 'Share is available during the reveal');
    check(await page.getByRole('button', { name: 'One more draft', exact: true }).isEnabled(), 'Replay is available during the reveal');
    if (reducedMotion === 'no-preference') {
      const skip = page.getByRole('button', { name: 'Skip animation', exact: true });
      if (await skip.count()) { await skip.click(); check(await page.locator('.dr-map-revealing').count() === 0, 'Skip immediately reveals the complete map'); }
      else check(await page.locator('.dr-map-revealing').count() === 0, 'Natural animation completion releases promoted layers');
    } else {
      check(await page.locator('.dr-map-wave').evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none')), 'Reduced motion has no map animation');
      check(await page.getByRole('button', { name: 'Skip animation', exact: true }).count() === 0, 'Reduced motion needs no skip action');
    }
    check(await page.locator('.dr-campaign-pick').count() === 2, 'The completed cabinet identifies two different appointments');
    check((await page.locator('.dr-campaign-highlights').innerText()).includes(story.strongest.person.name), 'Standout is derived from this cabinet');
    check(await page.locator('.dr-result-number .cu-live').innerText() === String(done.score), 'Final result retains the canonical score');
    check(await page.locator('.dr-map').getAttribute('aria-label') === `${done.score} of 195 countries taken`, 'Map has an accurate accessible final count');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow at ${width}`);
    await page.screenshot({ path: `${output}/result-${width}-${reducedMotion}.png`, fullPage: true });
    await page.getByRole('button', { name: 'One more draft', exact: true }).click();
    await page.getByRole('heading', { name: 'Pick a country', exact: true }).waitFor();
    check(await page.locator('.dr-campaign-highlights').count() === 0 && await page.locator('.dr-header-score .num').innerText() === '0', 'Replay resets story and score together');
    check(errors.length === 0, `No browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  const fullContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const fullPage = await fullContext.newPage();
  let simulated = initial;
  let moves = 0;
  let resetNext = false;
  await fullPage.route('**/*', async route => {
    if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
    const [input] = route.request().postDataJSON();
    const action = input?.action;
    moves++;
    if (resetNext) simulated = initial;
    else if (action?.t === 'open') simulated = openCountry(simulated, action.c);
    else if (action?.t === 'appoint') simulated = appoint(simulated, action.i, action.s);
    else if (action?.t === 'next') simulated = nextRound(simulated);
    else if (!action) simulated = initial;
    else throw new Error(`Unexpected fixture action: ${JSON.stringify(action)}`);
    const view = draftView(simulated, true);
    return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify({ success: !resetNext, reset: resetNext, view, revision: resetNext ? 0 : moves, sessionToken: `full-${moves}` })}\n` });
  });
  await fullPage.goto(`${base}/games/country-draft/play?mode=practice`, { waitUntil: 'networkidle' });
  let clicks = 0;
  for (let round = 0; round < 5; round++) {
    await fullPage.locator('.dr-country-card').first().click(); clicks++;
    await fullPage.locator('.dr-person-select').first().click(); clicks++;
    check(await fullPage.locator('.dr-job-option').count() === 5 - round, 'Only still-open jobs are offered');
    await fullPage.locator('.dr-job-option').first().click(); clicks++;
    await fullPage.getByRole('button', { name: round === 4 ? 'Reveal my cabinet' : 'Next country', exact: true }).click(); clicks++;
    await fullPage.locator('.dr-game[aria-busy="false"]').waitFor();
    check(await fullPage.locator('.dr-header-score .num').innerText() === String(draftView(simulated).score), 'Early Next cannot freeze an intermediate score');
  }
  check(clicks === 20 && moves === 15, 'Complete draft needs exactly 20 intentional clicks and 15 canonical commits');
  check(await fullPage.locator('.dr-result-number .cu-live').innerText() === String(draftView(simulated).score), 'Complete flow shows the actual simulated score');
  await fullPage.getByRole('button', { name: 'One more draft', exact: true }).click();
  await fullPage.getByRole('heading', { name: 'Pick a country', exact: true }).waitFor();
  resetNext = true;
  await fullPage.locator('.dr-country-card').first().click();
  await fullPage.getByText('Practice roster updated. A fresh draft is ready.', { exact: true }).waitFor();
  check(await fullPage.getByRole('button', { name: 'Try again', exact: true }).count() === 0, 'A roster reset never offers to retry stale indices');
  check(await fullPage.locator('.dr-person-select').count() === 0 && await fullPage.locator('.dr-header-score .num').innerText() === '0', 'A roster reset shows only the fresh canonical board');
  await fullContext.close();
  writeFileSync(`${output}/report.json`, JSON.stringify({ checks, writesToDatabase: 0, widths: [320, 390, 1440], motion: ['reduce', 'no-preference'] }, null, 2));
  console.log(`Draft presentation: ${checks} checks passed; all result and replay states are local fixtures.`);
} finally { await browser.close(); }
