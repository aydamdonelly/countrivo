import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to the existing playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const output = '.check-render/growth';
mkdirSync(output, {recursive:true});
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const offset = n => new Date(Date.parse(`${today}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0,10);
let checks = 0;
const verify = (condition, message) => { assert(condition, message); checks++; };
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addCookies([{name:'cv_activity',value:encodeURIComponent(JSON.stringify({days:[offset(-3),offset(-2),today],current:1,best:8,played:12})),url:base}]);
    for (const [name, path] of [['home','/'], ['geowordle','/games/geo-wordle'], ['leaderboard','/leaderboard'], ['urban','/practice/urban-geography'], ['europe','/practice/europe-flags']]) {
      const response = await page.goto(base + path, {waitUntil:'networkidle'});
      verify(response?.status() === 200, `${name}@${width}: HTTP 200`);
      verify(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${name}@${width}: no horizontal overflow`);
      if (name === 'home') {
        verify(await page.locator('.habit-stamp').count() === 7, 'Seven-day habit row');
        verify(await page.getByText('Best 8 days', {exact:true}).count() === 1, 'Historical best survives a missed day');
        await page.getByText('Remind me', {exact:true}).click();
        await page.getByLabel('Local time').fill('19:30');
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('button', {name:'Add to calendar',exact:true}).click();
        const download = await downloadEvent;
        await download.saveAs(`${output}/reminder-${width}.ics`);
        verify(await page.getByText('Open the calendar file to choose and save your reminder.', {exact:true}).isVisible(), 'Reminder explains user must import the file');
        await page.getByText('Remind me', {exact:true}).click();
      }
      if (name === 'geowordle') {
        await page.getByText('How to play', {exact:true}).click();
        const example = page.getByText('See a worked example', {exact:true});
        if (await example.count()) await example.click();
        verify(await page.getByText('Poland', {exact:false}).count() > 0, 'Original engine-generated guide is present');
      }
      await page.screenshot({path:`${output}/${name}-${width}.png`,fullPage:true,animations:'disabled'});
    }
    verify(errors.length === 0, `No browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  writeFileSync(`${output}/report.json`, JSON.stringify({checks,today,scope:'Read-only website flows and calendar download; no game moves submitted.'},null,2));
  console.log(`Growth release: ${checks} checks passed.`);
} finally { await browser.close(); }
