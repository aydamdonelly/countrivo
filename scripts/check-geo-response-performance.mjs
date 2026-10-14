import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
const measurements = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({viewport:{width,height:900}});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    let posts = 0;
    let unblock;
    const held = new Promise(resolve => {unblock = resolve;});
    await page.route('**/*', async route => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action']) {
        posts++;
        await held;
        await route.abort('failed');
      } else await route.continue();
    });
    await page.goto(`${base}/games/geo-wordle/play?mode=practice`, {waitUntil:'domcontentloaded'});
    const input = page.getByRole('combobox', {name:'Country',exact:true});
    await page.waitForFunction(() => {const input=document.getElementById('geo-guess');return input&&Object.keys(input).some(key=>key.startsWith('__reactProps'));});
    await input.fill('France');
    const start = performance.now();
    await page.getByRole('button', {name:'Guess',exact:true}).click();
    await page.locator('.gw-pending').filter({hasText:'France'}).waitFor();
    const feedbackMs = Math.round(performance.now() - start);
    assert(feedbackMs < 250, `Pending choice took ${feedbackMs}ms at ${width}px`);
    assert.equal(await page.locator('.gw-pending .gw-readout').count(),0,'No unconfirmed distances or directions');
    assert(await input.isEnabled(),'Country typing must remain enabled while a guess saves');
    await input.fill('Japan');
    await page.getByRole('option', {name:'Japan',exact:true}).click();
    assert.equal(await input.inputValue(),'Japan','Selecting the next suggestion prepares its name');
    await input.press('Enter');
    assert.equal(posts,1,'Preparation must not send another answer before the first commit');
    unblock();
    await page.getByRole('alert').filter({hasText:'Could not save this guess'}).waitFor();
    assert.equal(await page.locator('.gw-pending').count(),0,'An unconfirmed pending row must be removed on failure');
    assert.equal(await input.inputValue(),'Japan','Prepared input survives a failed previous commit');
    assert(await page.getByRole('button',{name:'Guess',exact:true}).isEnabled(),'Retry must become available');
    measurements.push({width,feedbackMs,posts,editableWhileSaving:true});
    await context.close();
  }
  mkdirSync('.check-render/performance',{recursive:true});
  writeFileSync('.check-render/performance/geo-response.json',JSON.stringify(measurements,null,2)+'\n');
  console.log(JSON.stringify(measurements,null,2));
} finally {await browser.close();}
