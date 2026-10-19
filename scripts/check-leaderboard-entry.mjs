import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Synthetic local server acknowledgements exercise the real form without writing public scores.
const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local QA only.');
const out = '.check-render/leaderboard-entry'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
let checks = 0;
function check(ok, label) { assert(ok, label); checks++; }
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { if (!localStorage.getItem('qa-seeded')) { localStorage.setItem('countrivo_leaderboard_name', '"Previous Name"'); localStorage.setItem('qa-seeded', '1'); } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let posts = 0, publishes = 0, removals = 0, countryReads = 0, rank = 3, count = 11, empty = false;
    const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
    const run = { id: 991234, gameSlug: 'flag-quiz', mode: 'daily', dailyDate: dateKey, scoreRaw: 10, scoreMax: 13, scoreSortValue: 10, scoreNormalized: 10 / 13, scoreDisplay: '10 of 13', rankDaily: null, percentile: null, isPersonalBest: false, resultJson: {}, completedAt: new Date().toISOString(), dailyNameCount: count - 1, rankPreview: { rank, playerCount: count } };
    const view = { kind: 'flag-quiz', mode: 'daily', phase: 'finished', round: 10, total: 10, score: '10 of 13', progress: { done: 10, total: 10, value: '10' }, shareText: 'Flag Quiz result', history: [], flagSrc: '', options: [], picked: null, correctIndex: null, fact: null, source: null, doubled: false };
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.method() !== 'POST' || !request.headers()['next-action']) return route.continue();
      posts++;
      const args = JSON.parse(request.postData() ?? '[]'); let response;
      if (args[0] && typeof args[0] === 'object') response = { success: true, view, run: { ...run, rankPreview: { rank: empty ? 1 : rank, playerCount: empty ? 1 : count } }, publishedName: null, sessionToken: 'synthetic-complete', revision: 1 };
      else if (args.length === 3) {
        publishes++;
        await new Promise(resolve => setTimeout(resolve, 250));
        response = publishes === 1 ? { success: false, error: 'Connection interrupted. Try again.' } : { success: true, run: { ...run, rankPreview: undefined, rankDaily: rank, dailyNameCount: count }, publishedName: args[1].trim() };
      } else if (args.length === 1) { removals++; response = { success: true, run: { ...run, rankPreview: { rank, playerCount: count } } }; }
      else if (new URL(page.url()).pathname === '/privacy') response = undefined;
      else { countryReads++; response = [{ iso3: 'DEU', name: 'Germany' }]; }
      return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${response === undefined ? '"$undefined"' : JSON.stringify(response)}\n` });
    });
    async function finish() {
      const href = `${base}/games/flag-quiz/play?mode=daily`;
      try { await page.goto(href, { waitUntil: 'domcontentloaded' }); }
      catch (error) { if (!String(error).includes('ERR_ABORTED')) throw error; await page.goto(href, { waitUntil: 'domcontentloaded' }); }
      await page.waitForFunction(() => { const button = document.querySelector('.opt'); return button && Object.keys(button).some(key => key.startsWith('__reactProps')); });
      await page.locator('.opt').first().click();
      await page.getByRole('heading', { name: 'Join today’s leaderboard', exact: true }).waitFor();
    }
    await finish();
    const input = page.getByRole('textbox', { name: 'Your name on the board', exact: true });
    await input.waitFor(); await page.waitForFunction(() => document.querySelector('input[name="displayName"]')?.value === 'Previous Name');
    check(await input.isVisible(), 'Name input is immediately visible without an opening tap');
    check(await page.getByText('You’d be #3 of 11', { exact: true }).isVisible(), 'Private rank is explicitly hypothetical');
    check(await page.getByText('Preview · not published. Equal scores share a place.', { exact: true }).isVisible(), 'Preview and tie rule are labelled');
    check(!(await input.evaluate(element => element === document.activeElement)), 'Result never autofocuses the name input');
    check(publishes === 0, 'Remembered name never auto-publishes');
    check(countryReads === 0, 'Country list is fetched only when requested');
    await input.fill('New Name');
    await page.screenshot({ path: `${out}/join-${width}.png` });
    const join = page.getByRole('button', { name: 'Put me on the leaderboard', exact: true });
    await join.click();
    await page.getByRole('button', { name: 'Saving name…', exact: true }).waitFor();
    check(await page.getByRole('button', { name: 'Saving name…', exact: true }).isDisabled(), 'Pending publication disables repeat submission');
    await page.getByRole('alert').filter({ hasText: 'Connection interrupted.' }).waitFor();
    check(await page.evaluate(() => localStorage.getItem('countrivo_leaderboard_name')) === '"Previous Name"', 'Failed publication never saves a new name preference');
    check(await input.inputValue() === 'New Name', 'An error keeps the typed name for retry');
    await join.click(); await page.getByText('You’re #3 of 11', { exact: true }).waitFor();
    check(await page.evaluate(() => localStorage.getItem('countrivo_leaderboard_name')) === '"New Name"', 'Only confirmed publication remembers the new name');
    check(await page.getByRole('link', { name: 'See your place', exact: true }).isVisible(), 'Published state links directly to the real board');
    await page.getByRole('button', { name: 'Change name', exact: true }).click();
    check(await input.inputValue() === 'New Name', 'Rename starts from the current public name');
    await input.fill('Unsent Name'); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    check(await page.getByText('New Name', { exact: true }).isVisible(), 'Cancelling rename keeps the public name');
    await page.getByRole('button', { name: 'Remove my name', exact: true }).click();
    await page.getByRole('button', { name: 'Keep it', exact: true }).click();
    check(removals === 0, 'Cancelling removal leaves the name published');
    await page.screenshot({ path: `${out}/published-${width}.png` });
    await page.getByRole('button', { name: 'Remove my name', exact: true }).click();
    await page.getByRole('button', { name: 'Remove name', exact: true }).click();
    await page.getByText('Name removed. Your result is private.', { exact: true }).waitFor();
    check(await input.isVisible(), 'Removing a name returns to the clear private join form');
    check(removals === 1 && publishes === 2, 'Only explicit submit/confirmation invokes publication or removal');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No horizontal overflow');
    await page.addStyleTag({ content: '.leaderboard-entry { font-size: 200%; } .leaderboard-entry .t-h3 { font-size: 40px; } .leaderboard-entry .t-body,.leaderboard-entry input,.leaderboard-entry .btn { font-size: 32px; }' });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Join panel remains within the viewport at200% text size');
    check(await page.locator('.leaderboard-entry .t-h3,.leaderboard-entry .btn').evaluateAll(elements => elements.every(element => { const style = getComputedStyle(element); return parseFloat(style.lineHeight) >= parseFloat(style.fontSize); })), 'Enlarged multiline headings and buttons keep readable line spacing');
    await page.screenshot({ path: `${out}/large-text-${width}.png` });
    check(errors.length === 0, `No browser errors: ${errors.join('; ')}`);
    empty = true; await finish();
    check(await page.getByText('Be the first today', { exact: true }).isVisible(), 'Empty boards invite the first player without inventing an existing crowd');
    check(await input.inputValue() === 'New Name', 'Next game reuses the last successfully published name');
    await page.goto(`${base}/privacy`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(button => button.textContent === 'Forget this device' && Object.keys(button).some(key => key.startsWith('__reactProps'))));
    await page.getByRole('button', { name: 'Forget this device', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Forget this device', exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem('countrivo_leaderboard_name') === null, undefined, { timeout: 10000 });
    check(await page.evaluate(() => localStorage.getItem('countrivo_leaderboard_name')) === null, 'Forget this device clears the saved name preference');
    check(posts > 0, 'Synthetic actions exercised the real client form');
    await context.close();
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({ checks, scope: 'Local synthetic server responses; no public names or runs written' }, null, 2) + '\n');
  console.log(`Leaderboard entry: ${checks} checks passed at390/1440; no public data written.`);
} finally { await browser.close(); }
