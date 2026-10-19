// Local-only slow/offline checks: intercepted moves never write real game runs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const out = '.check-render/play-feedback';
mkdirSync(out, { recursive: true });
const measurements = [];
let checks = 0;
function check(value, message) { assert(value, message); checks++; }

try {
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 844, height: 390}, {width: 1440, height: 900}]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    for (const slug of ['higher-or-lower', 'geo-wordle', 'pinpoint']) {
      await page.goto(`${base}/games/${slug}/play?mode=practice`, { waitUntil: 'networkidle' });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slug} fits ${viewport.width}px without horizontal scrolling`);
      const frame = await page.locator('.play-frame').boundingBox();
      check(frame && Math.abs(frame.x - (viewport.width - frame.width) / 2) < 1, `${slug} is centered at ${viewport.width}px`);
      if (viewport.width >= 1024) check(frame.width <= (slug === 'higher-or-lower' ? 1000 : 720), `${slug} keeps its deliberate desktop width`);
      const heading = page.locator(slug === 'higher-or-lower' ? '.qr-header h1' : '.pb h1');
      check(await heading.evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${slug} title is not clipped at ${viewport.width}px`);
      const help = page.getByRole('button', {name: `How to play ${await heading.textContent()}`, exact: true});
      if (await help.count()) {
        const box = await help.boundingBox();
        check(box && box.width >= 44 && box.height >= 44, 'Help retains a 44px touch target');
      }
      if (slug === 'higher-or-lower') {
        const controls = await page.locator('.qr-call-controls').boundingBox();
        for (const value of await page.locator('.qr-value').all()) {
          const box = await value.boundingBox();
          check(box.y + box.height <= controls.y, 'Higher/Lower controls never cover comparison values');
        }
      }
      await page.screenshot({ path: `${out}/${slug}-${viewport.width}.png`, fullPage: true });
    }
    await context.close();
  }

  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: {width: 390, height: 844}, reducedMotion });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    let posts = 0;
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
      posts++;
      await held;
      return route.abort('failed');
    });
    await page.goto(`${base}/games/geo-wordle/play?mode=practice`, {waitUntil: 'networkidle'});
    const input = page.getByRole('combobox', {name: 'Country', exact: true});
    const notice = page.locator('.session-notice');
    const idleHeight = (await notice.boundingBox()).height;
    await input.fill('France');
    const guess = page.getByRole('button', {name: 'Guess', exact: true});
    await guess.evaluate(button => button.addEventListener('click', () => { document.documentElement.dataset.moveClickedAt = String(performance.now()); }, {once: true}));
    await guess.click();
    await page.waitForFunction(() => {
      const status = document.querySelector('.session-status[data-pending]');
      if (!status?.textContent || getComputedStyle(status).opacity !== '1') return false;
      document.documentElement.dataset.feedbackLatency = String(performance.now() - Number(document.documentElement.dataset.moveClickedAt));
      return true;
    });
    const latency = Number(await page.locator('html').getAttribute('data-feedback-latency'));
    check(latency < 150, `Pending status is immediately visible (${latency.toFixed(1)}ms, ${reducedMotion})`);
    check((await notice.boundingBox()).height === idleHeight, 'Pending feedback uses the existing reserved row');
    check(await page.locator('.gw-pending .gw-readout').count() === 0, 'No answer or direction appears before acknowledgement');
    await input.fill('Japan');
    await input.press('Enter');
    check(posts === 1, 'Repeated input cannot commit twice while the first move is pending');
    await page.screenshot({path: `${out}/pending-${reducedMotion}.png`, fullPage: true});
    release();
    await notice.getByRole('alert').waitFor();
    check(await notice.getByRole('button', {name: 'Try again', exact: true}).isEnabled(), 'An offline move has a usable retry');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Long recovery copy fits the phone');
    check(await input.inputValue() === 'Japan', 'Pending next input survives a network failure');
    await page.screenshot({path: `${out}/recovery-${reducedMotion}.png`, fullPage: true});
    measurements.push({reducedMotion, feedbackMs: latency, idleStatusHeight: idleHeight, posts});
    await context.close();
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({checks, measurements}, null, 2) + '\n');
  console.log(`${checks} play-shell and slow/offline feedback checks passed; no runs written.`);
} finally { await browser.close(); }
