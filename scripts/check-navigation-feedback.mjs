// Hold real RSC requests to verify click acknowledgement without replacing the page.
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
  const cases = [
    {kind:'logo', from:'/games/country-draft/leaderboard', selector:'.table-header .wm', content:'.new-leaderboard', path:'/', query:''},
    {kind:'game-tile', from:'/', selector:'[data-game="country-draft"] .game-tile-main', content:'.table-home', path:'/games/country-draft/play', query:'mode=daily'},
    {kind:'practice', from:'/practice', selector:'[data-game="geo-wordle"] .game-tile-main', content:'.table-home', path:'/games/geo-wordle/play', query:'mode=practice'},
    {kind:'back', from:'/games/geo-wordle/play?mode=practice', selector:'.pb .back', content:'.play-root', path:'/practice', query:''},
    {kind:'draft-back', from:'/games/country-draft/play?mode=practice', selector:'.dr-play-header .dr-back', content:'.play-root', path:'/practice', query:''},
    {kind:'quick-back', from:'/games/higher-or-lower/play?mode=practice', selector:'.qr-header a[aria-label="Back to games"]', content:'.play-root', path:'/practice', query:''},
    {kind:'date-link', from:'/games/country-draft/leaderboard', selector:'.lb-date a[aria-label="Previous day"]', content:'.new-leaderboard'},
    {kind:'shared-button', from:'/games/country-draft/leaderboard', selector:'.lb-play-prompt .btn', content:'.new-leaderboard', path:'/games/country-draft/play', query:'mode=daily'},
    {kind:'switch-game', from:'/games/country-draft/leaderboard', selector:'.lb-games a[href^="/games/geo-wordle/leaderboard"]', content:'.new-leaderboard', path:'/games/geo-wordle/leaderboard'},
  ];
  for (const {width, reducedMotion} of [{width:320,reducedMotion:'reduce'}, {width:1440,reducedMotion:'reduce'}, {width:390,reducedMotion:'no-preference'}]) {
    for (const {kind, from, selector, content, path, query} of cases.filter(test => reducedMotion === 'reduce' || test.kind === 'practice')) {
      const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion});
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      let release;
      const held = new Promise(resolve => {release = resolve;});
      let rscRequests = 0, blockedPosts = 0, documentRequests = 0;
      let targetPath = path, targetQuery = query;
      let clicked = false;
      await page.route('**/*', async route => {
        const request = route.request();
        // Usage analytics may queue a write; none is allowed out of this read-only suite.
        if (request.method() === 'POST') {blockedPosts++; return route.abort('blockedbyclient');}
        const url = new URL(request.url());
        if (clicked && request.isNavigationRequest() && request.resourceType() === 'document') documentRequests++;
        url.searchParams.delete('_rsc');
        if (request.headers().rsc === '1' && url.pathname === targetPath && (targetQuery === undefined || url.searchParams.toString() === targetQuery)) {
          rscRequests++;
          await held;
        }
        return route.continue();
      });
      try {
        await page.goto(`${base}${from}`, {waitUntil: 'domcontentloaded'});
        if (kind === 'switch-game') await page.locator('.lb-game-picker summary').click();
        const link = page.locator(selector);
        const destination = new URL(await link.getAttribute('href'), base);
        targetPath = destination.pathname;
        targetQuery = destination.searchParams.toString();
        if(rscRequests === 0) {
          const intent = page.waitForRequest(request => {
            const url = new URL(request.url()); url.searchParams.delete('_rsc');
            return request.headers().rsc === '1' && url.pathname === targetPath && url.searchParams.toString() === targetQuery;
          });
          await link.focus();
          await intent;
        } else await link.focus();
        const before = await link.evaluate(node => ({width:node.offsetWidth, height:node.offsetHeight, text:[...node.childNodes].filter(child => !child.classList?.contains('navigation-status')).map(child => child.textContent).join('')}));
        clicked = true;
        await link.evaluate(node => {document.documentElement.dataset.navigationClickedAt = String(performance.now()); node.click();});
        await page.waitForFunction(selector => {
          const link = document.querySelector(selector);
          if (!link?.querySelector('.navigation-status[data-pending]')?.textContent.includes('Opening')) return false;
          document.documentElement.dataset.navigationFeedbackMs = String(performance.now() - Number(document.documentElement.dataset.navigationClickedAt));
          return true;
        }, selector);
        const feedbackMs = Number(await page.locator('html').getAttribute('data-navigation-feedback-ms'));
        check(feedbackMs < 250, `${kind}: pending navigation is visible promptly (${feedbackMs.toFixed(1)}ms)`);
        check(await link.evaluate(node => getComputedStyle(node).opacity === '1'), 'Pending label stays visible');
        check(await link.evaluate(node => getComputedStyle(node).outlineWidth === '2px'), 'The whole clicked control acknowledges navigation');
        check(await link.evaluate((node, before) => node.offsetWidth === before.width && node.offsetHeight === before.height, before), 'The clicked control keeps its layout size');
        check(await link.evaluate((node, before) => [...node.childNodes].filter(child => !child.classList?.contains('navigation-status')).map(child => child.textContent).join('') === before.text, before), 'The original destination label remains');
        if(kind === 'game-tile' || kind === 'practice')check(await link.evaluate(node => {
          const title = node.querySelector('.game-tile-title'), label = node.querySelector('.navigation-status-label');
          if(!title || !label)return false;
          const range = document.createRange(); range.selectNodeContents(title);
          return range.getBoundingClientRect().bottom <= label.getBoundingClientRect().top;
        }), 'The pending message never overlaps the game title');
        check(await page.locator(content).isVisible(), 'Existing page remains visible during navigation');
        if (reducedMotion === 'reduce') check(await link.evaluate(node => node.getAnimations({subtree:true}).every(animation => animation.playState !== 'running' || Number(animation.effect?.getTiming().duration) <= 1)), 'Reduced motion leaves feedback static');
        else {
          check(await link.locator('.navigation-status-mark').evaluate(node => getComputedStyle(node).animationName === 'navigation-direction'), 'Pending direction is graphic, while the title stays still');
          check(await link.locator('.clay-object').evaluate(node => getComputedStyle(node).animationIterationCount === '1'), 'The clay acknowledgement is finite');
          await link.evaluate(node => node.getAnimations({subtree:true}).forEach(animation => {animation.pause(); animation.currentTime = 240;}));
        }
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Pending navigation causes no horizontal overflow');
        await page.screenshot({path: `${out}/${kind}-${width}.png`, fullPage: true});
        check(rscRequests > 0, 'The navigation RSC request is actually held');
        release();
        await page.waitForURL(destination.href);
        check(await page.locator('a [aria-busy="true"]').count() === 0, 'Pending label settles after navigation');
        check(documentRequests === 0, 'Web navigation uses the client router without a document reload');
        if (reducedMotion === 'no-preference') {
          const map = page.locator('.gw-map');
          await map.waitFor();
          check(await map.evaluate(node => {const style=getComputedStyle(node); return style.animationName === 'game-map-arrive' && style.animationIterationCount === '1';}), 'The destination map has a finite arrival');
          check(await page.locator('.gw-input').evaluate(node => getComputedStyle(node).animationName === 'none'), 'The country input stays stationary');
        }
        measurements.push({width, kind, reducedMotion, feedbackMs, heldRscRequests: rscRequests, blockedPosts, documentRequests});
        console.log(`${width}px ${kind}: acknowledged in ${feedbackMs.toFixed(1)}ms; original content retained.`);
      } finally {release(); await context.close();}
    }
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({checks, measurements}, null, 2) + '\n');
  console.log(`${checks} held-RSC navigation-feedback checks passed; all writes blocked.`);
} finally {await browser.close();}
