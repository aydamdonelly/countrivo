// Local integration only. Every POST is intercepted; no feedback or other data is written.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const out = '.check-render/site-feedback';
mkdirSync(out, { recursive: true });
const results = [];
let checks = 0;
function check(value, label) { assert(value, label); checks++; }
function respond(route, value) { return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n` }); }

try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [], bodies = [];
    let release;
    const held = new Promise(resolve => { release = resolve; });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      if (!route.request().headers()['next-action']) return route.abort('blockedbyclient');
      bodies.push(route.request().postData());
      if (bodies.length === 1) {
        await held;
        return respond(route, { success: false, code: 'unavailable', error: 'Could not save your feedback. Your text is still here. Try again.' });
      }
      return respond(route, { success: true });
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    const feedback = page.locator('footer .site-feedback');
    check(await feedback.count() === 1, 'Footer exposes one feedback disclosure');
    check(await feedback.getAttribute('open') === null, 'Footer feedback starts collapsed');
    await feedback.locator('summary').click();
    const textarea = feedback.getByRole('textbox', { name: 'What should we improve?', exact: true });
    await textarea.waitFor();
    check(await feedback.locator('form').getAttribute('method') === 'post', 'Unhydrated form cannot leak private feedback into a GET query');
    check(await textarea.getAttribute('aria-describedby') !== null, 'Text field is labelled and has an associated hint');
    check(await feedback.getByRole('radio').count() === 0, 'Site-only form does not offer a nonexistent game');
    const draft = '[QA intercepted only] Please make the country labels easier to read.';
    await textarea.fill('four');
    await feedback.getByRole('button', { name: 'Send feedback', exact: true }).click();
    check(bodies.length === 0, 'Native minimum length prevents an empty/too-short network send');
    await textarea.fill(draft);
    await feedback.getByRole('button', { name: 'Send feedback', exact: true }).click();
    const pending = feedback.getByRole('button', { name: 'Sending…', exact: true });
    await pending.waitFor();
    check(await pending.isDisabled(), 'Pending submit is visibly disabled');
    check((await feedback.getByRole('status').textContent()).includes('Sending your feedback'), 'Pending feedback is announced immediately');
    check(await textarea.inputValue() === draft, 'Typed text remains during the held request');
    check(await textarea.getAttribute('readonly') !== null, 'Pending draft cannot be changed behind the submitted request');
    await feedback.locator('form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    check(bodies.length === 1, 'Rapid repeated submit events do not send another request');
    await page.screenshot({ path: `${out}/pending-${viewport.width}x${viewport.height}.png`, fullPage: true });
    if (viewport.width === 390) await feedback.screenshot({ path: `${out}/feedback-pending-mobile.png` });
    release();
    await feedback.getByRole('alert').waitFor();
    check(await textarea.inputValue() === draft, 'Failed save preserves the complete typed feedback');
    check(await textarea.isEditable(), 'Failed save allows correction');
    await feedback.locator('summary').click();
    await feedback.locator('summary').click();
    check(await textarea.inputValue() === draft, 'Closing and reopening the disclosure retains the draft');
    await feedback.getByRole('button', { name: 'Try again', exact: true }).click();
    await feedback.getByRole('button', { name: 'Write another', exact: true }).waitFor();
    check(bodies.length === 2 && bodies[0] === bodies[1], 'Retry reuses the same payload and idempotency identifier');
    check((await feedback.getByRole('status').textContent()).includes('Your feedback is saved'), 'Only successful response shows saved feedback');
    check(await feedback.getByRole('button', { name: 'Sent', exact: true }).isDisabled(), 'Already-sent feedback cannot be resubmitted');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Feedback creates no horizontal overflow');
    const box = await textarea.boundingBox();
    check(box && box.width <= viewport.width && box.x >= 0, 'Textarea stays within the viewport');
    await page.screenshot({ path: `${out}/saved-${viewport.width}x${viewport.height}.png`, fullPage: true });
    if (viewport.width === 390) await feedback.screenshot({ path: `${out}/feedback-saved-mobile.png` });
    await feedback.getByRole('button', { name: 'Write another', exact: true }).click();
    check(await textarea.inputValue() === '', 'Writing another starts a fresh draft explicitly');
    check(await textarea.evaluate(node => document.activeElement === node), 'Write another restores focus to the textarea');
    check(errors.length === 0, `No client exceptions: ${errors.join('; ')}`);
    results.push({ viewport, interceptedActionPosts: bodies.length, writes: 0, draftPreserved: true, retryIdempotencyPreserved: true });
    console.log(`site feedback ${viewport.width}x${viewport.height}: pending, failure, retry and success passed`);
    await context.close();
  }
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, noDatabaseWrites: true, results }, null, 2) + '\n');
  console.log(`check-site-feedback-ui: ${checks} checks passed; all POSTs intercepted`);
} finally { await browser.close(); }
