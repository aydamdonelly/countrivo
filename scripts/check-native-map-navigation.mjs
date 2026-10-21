// Local-only navigation checks. Every mutation is intercepted; no game move is sent.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use a local server.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const {chromium, webkit} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out = '.check-render/ipad-navigation';
mkdirSync(out, {recursive: true});
const rows = [];
let checks = 0;
function check(value, label) {assert(value, label); checks++;}

for (const engine of ['chromium', ...(process.env.PLAYWRIGHT_WEBKIT ? ['webkit'] : [])]) {
  const browser = await (engine === 'webkit'
    ? webkit.launch({headless: true, executablePath: process.env.PLAYWRIGHT_WEBKIT})
    : chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
  try {
    for (const native of [true, false]) for (const [slug, title, board] of [['geo-wordle', 'GeoWordle', '.gw-map'], ['pinpoint', 'Pinpoint', '.pp-map']]) {
      const context = await browser.newContext({viewport: {width: 1032, height: 1376}, hasTouch: true});
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      let release;
      const held = new Promise(resolve => {release = resolve;});
      let armed = false, documents = 0, rsc = 0, posts = 0, scripts = 0;
      const errors = [];
      let reportFeedback;
      const feedback = new Promise(resolve => {reportFeedback = resolve;});
      let reportRequest;
      const requested = new Promise(resolve => {reportRequest = resolve;});
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.text().startsWith('COUNTRIVO_NAV_QA ')) reportFeedback(JSON.parse(message.text().slice(17)));
      });
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() === 'POST') {posts++; return route.abort('blockedbyclient');}
        if (armed && request.resourceType() === 'script') scripts++;
        if (armed && url.pathname === `/games/${slug}/play` && url.searchParams.get('mode') === 'practice') {
          if (request.isNavigationRequest()) documents++;
          if (request.headers().rsc === '1') rsc++;
          if (native && request.isNavigationRequest() || !native && request.headers().rsc === '1') {reportRequest(); await held;}
        }
        return route.continue();
      });
      try {
        const home = await page.goto(base, {waitUntil: 'networkidle', timeout: 45000});
        check(home?.status() === 200, 'The actual server renders Home successfully');
        if (native) await page.evaluate(() => Object.defineProperty(window, 'Capacitor', {configurable: true, value: {isNativePlatform: () => true}}));
        await page.evaluate(title => {
          const observer = new MutationObserver(() => {
            const pending = document.querySelector(`a[aria-label="Practice ${title}"] [aria-busy="true"]`);
            if (pending?.textContent !== 'Opening…') return;
            console.log(`COUNTRIVO_NAV_QA ${JSON.stringify({oldPageVisible: !!document.querySelector('.daily-game-grid')})}`);
            observer.disconnect();
          });
          observer.observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true});
        }, title);
        armed = true;
        const link = page.getByRole('link', {name: `Practice ${title}`, exact: true});
        check(await link.getAttribute('href') === `/games/${slug}/play?mode=practice`, 'The exact destination, including mode, is retained');
        await link.focus();
        await link.dispatchEvent('touchstart');
        await link.dispatchEvent('pointerdown');
        if (native) {
          await page.waitForTimeout(200);
          check(rsc === 0, 'Native map intent does not request an RSC prefetch');
          check(scripts === 0, 'Native map intent does not preload an interactive chunk');
        }
        const openedAt = performance.now();
        // Playwright may wait for a document navigation before resolving the click.
        const clicked = link.evaluate(node => node.click());
        let timer;
        let feedbackMs = null;
        // This installed WebKit/driver pair does not reliably deliver the console probe.
        if (engine !== 'webkit') {
          const visibleFeedback = await Promise.race([feedback, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('No pending feedback observed')), 2000);})]).finally(() => clearTimeout(timer));
          check(visibleFeedback.oldPageVisible, 'The current page remains visible while the request is held');
          feedbackMs = Math.round(performance.now() - openedAt);
          check(feedbackMs < 500, `Feedback appears promptly (${feedbackMs}ms)`);
        }
        await Promise.race([requested, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('No target request observed')), 2000);})]).finally(() => clearTimeout(timer));
        check(native ? documents === 1 && rsc === 0 : documents === 0 && rsc > 0, 'Only native maps prevent the SPA transition and use one document navigation');
        release();
        await clicked;
        await page.waitForURL(`**/games/${slug}/play?mode=practice`);
        await page.locator(board).waitFor();
        check(await page.locator(board).isVisible(), 'The destination contains the real map board');
        if (native) {
          armed = false;
          await page.goBack({waitUntil: 'domcontentloaded'});
          await page.getByRole('heading', {name: 'Daily games', exact: true}).waitFor();
          check(await page.getByText('Opening…', {exact: true}).count() === 0, 'History return does not retain the pending label');
        }
        check(posts === 0, 'No move or other mutation is submitted');
        check(errors.length === 0, 'No JavaScript exception occurs');
        rows.push({engine, nativePlatformStub: native, slug, documents, rscRequests: rsc, feedbackMs, posts});
        console.log(`${engine} ${native ? 'native branch' : 'browser SPA'} ${slug}: pass`);
      } finally {release(); await context.close();}
    }
    if (engine === 'chromium') {
      const context = await browser.newContext();
      let posts = 0;
      await context.route('**/*', route => {
        if (route.request().method() === 'POST') {posts++; return route.abort('blockedbyclient');}
        return route.continue();
      });
      try {
        const page = await context.newPage();
        await page.goto(base, {waitUntil: 'networkidle', timeout: 45000});
        await page.evaluate(() => Object.defineProperty(window, 'Capacitor', {configurable: true, value: {isNativePlatform: () => true}}));
        const opened = context.waitForEvent('page');
        await page.getByRole('link', {name: 'Practice GeoWordle', exact: true}).click({modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control']});
        const tab = await opened;
        await tab.waitForURL('**/games/geo-wordle/play?mode=practice');
        await tab.locator('.gw-map').waitFor();
        check(new URL(page.url()).pathname === '/', 'A modified click keeps the original page');
        check(await page.getByText('Opening…', {exact: true}).count() === 0, 'A modified click does not leave the original link pending');
        check(posts === 0, 'A modified click submits no mutation');
        rows.push({engine, kind: 'modified-click', newTab: true, originalPageRetained: true, posts});
        console.log('chromium native branch modified-click: pass');
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
writeFileSync(`${out}/regression.json`, JSON.stringify({checks, rows, nativeLimit: 'Platform detection is stubbed after Home loads; actual iPad WKWebView verification is separate. Pending feedback timing is measured in Chromium, not in the installed WebKit/driver pair; no pre-navigation paint guarantee is made.'}, null, 2) + '\n');
console.log(`${checks} checks passed; no mutation sent.`);
