// Delay local RSC navigation only. No game, publish, report or block action is sent.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out = '.check-render/navigation-feedback';
mkdirSync(out, {recursive: true});
const measurements = [];
let checks = 0;
function check(value, label) {assert(value, label); checks++;}

try {
  for (const width of [320, 1440]) {
    for (const kind of ['date-link', 'shared-button']) {
      const context = await browser.newContext({viewport: {width, height: 900}});
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      let release;
      const held = new Promise(resolve => {release = resolve;});
      let rscRequests = 0, posts = 0;
      let target;
      await page.route('**/*', async route => {
        const request = route.request();
        if (request.method() === 'POST' && request.headers()['next-action']) {posts++; return route.abort('blockedbyclient');}
        const url = new URL(request.url());
        if (request.headers().rsc === '1' && target && url.pathname + url.searchParams.get('date') === target) {
          rscRequests++;
          await held;
        }
        return route.continue();
      });
      try {
        await page.goto(`${base}/games/country-draft/leaderboard`, {waitUntil: 'networkidle'});
        const selector = kind === 'date-link' ? '.lb-date a[aria-label="Previous day"]' : '.lb-play-prompt .btn';
        const link = page.locator(selector);
        const destination = new URL(await link.getAttribute('href'), base);
        target = destination.pathname + destination.searchParams.get('date');
        await link.evaluate(node => {document.documentElement.dataset.navigationClickedAt = String(performance.now()); node.click();});
        await page.waitForFunction(selector => {
          const link = document.querySelector(selector);
          if (!link?.querySelector('[aria-busy="true"]')?.textContent.includes('Opening…')) return false;
          document.documentElement.dataset.navigationFeedbackMs = String(performance.now() - Number(document.documentElement.dataset.navigationClickedAt));
          return true;
        }, selector);
        const feedbackMs = Number(await page.locator('html').getAttribute('data-navigation-feedback-ms'));
        check(feedbackMs < 150, `${kind}: pending navigation is visible promptly (${feedbackMs.toFixed(1)}ms)`);
        check(await link.evaluate(node => getComputedStyle(node).opacity === '1'), 'Pending label stays visible');
        check(await page.locator('.new-leaderboard').isVisible(), 'Existing page remains visible during navigation');
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Pending navigation causes no horizontal overflow');
        check(posts === 0, 'Read-only navigation sends no mutation');
        await page.screenshot({path: `${out}/${kind}-${width}.png`, fullPage: true});
        check(rscRequests > 0, 'The navigation RSC request is actually held');
        release();
        await page.waitForURL(destination.href);
        check(await page.locator('a [aria-busy="true"]').count() === 0, 'Pending label settles after navigation');
        measurements.push({width, kind, feedbackMs, heldRscRequests: rscRequests, posts});
      } finally {release(); await context.close();}
    }
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({checks, measurements}, null, 2) + '\n');
  console.log(`${checks} held-RSC navigation-feedback checks passed; no mutations.`);
} finally {await browser.close();}
