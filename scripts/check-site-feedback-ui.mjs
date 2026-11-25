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
    const posts = [{ id: 103, message: 'Keep the category units visible while I play.', scope: 'site', context: 'site', gameSlug: null, createdAt: '2026-10-28T10:00:00Z', source: 'player', upvotes: 2, downvotes: 0, score: 2, vote: 0 }];
    let release;
    const held = new Promise(resolve => { release = resolve; });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      if (!route.request().headers()['next-action']) return route.abort('blockedbyclient');
      const input = JSON.parse(route.request().postData() ?? 'null')?.[0];
      if (input?.limit === 20) return respond(route, { success: true, items: posts, nextBeforeId: null });
      if (Array.isArray(input)) return respond(route, true);
      if (typeof input?.message !== 'string') return route.abort('blockedbyclient');
      bodies.push(route.request().postData());
      if (bodies.length === 1) {
        await held;
        return respond(route, { success: false, code: 'unavailable', error: 'Could not save your feedback. Your text is still here. Try again.' });
      }
      posts.unshift({ ...posts[0], id: 104, message: input.message });
      return respond(route, { success: true });
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    const invitation = page.getByRole('button', { name: 'Give feedback', exact: true });
    check(await invitation.count() === 1, 'Home has one clear feedback invitation');
    const invitationBox = await invitation.boundingBox();
    check(invitationBox && invitationBox.y >= 0 && invitationBox.y + invitationBox.height <= viewport.height, 'The complete feedback invitation is visible in the first viewport');
    check(await invitation.evaluate(node => {
      const games = document.querySelector('.daily-game-grid');
      return games && Boolean(node.compareDocumentPosition(games) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), 'Feedback is offered before the game grid');
    check(await invitation.locator('img').evaluate(image => image.complete && image.naturalWidth > 0), 'The invitation shows the existing clay artwork');
    check(await invitation.evaluate(node => node.getAnimations({ subtree: true }).every(animation => animation.playState !== 'running' || Number(animation.effect.getTiming().duration) <= 1)), 'Reduced motion leaves the invitation static');
    check(await page.getByRole('dialog').count() === 0, 'The invitation leaves the home page playable until opened');
    await page.screenshot({ path: `${out}/home-${viewport.width}x${viewport.height}.png`, fullPage: true });
    await invitation.click();
    const feedback = page.getByRole('dialog', { name: 'We’re listening.', exact: true });
    await feedback.waitFor();
    const textarea = feedback.getByRole('textbox', { name: 'What should we improve?', exact: true });
    await textarea.waitFor();
    await page.waitForFunction(() => document.activeElement?.textContent === 'We’re listening.');
    check(await feedback.getByRole('heading', { name: 'We’re listening.', exact: true }).evaluate(node => document.activeElement === node), 'Opening feedback focuses the dialog heading without forcing the mobile keyboard');
    await feedback.locator('.feedback-post').waitFor();
    check(await feedback.getByRole('heading', { name: 'Community feedback', exact: true }).isVisible(), 'One invitation opens the form and public feedback together');
    check(await page.getByRole('link', { name: 'Read feedback & vote' }).count() === 0, 'Reading feedback needs no second navigation link');
    check(await feedback.evaluate(node => node.querySelector('form').compareDocumentPosition(node.querySelector('.feedback-feed')) & Node.DOCUMENT_POSITION_FOLLOWING), 'The public board follows the form in the same dialog');
    check(await feedback.getAttribute('aria-modal') === 'true', 'Feedback opens as a modal dialog');
    check(await feedback.locator('form').getAttribute('method') === 'post', 'Unhydrated form cannot leak private feedback into a GET query');
    check(await textarea.getAttribute('aria-describedby') !== null, 'Text field is labelled and has an associated hint');
    check(await feedback.getByRole('radio').count() === 0, 'Site-only form does not offer a nonexistent game');
    const draft = '[QA intercepted only] Please make the country labels easier to read.';
    await textarea.fill(draft);
    await page.keyboard.press('Escape');
    await feedback.waitFor({ state: 'detached' });
    check(await invitation.evaluate(node => document.activeElement === node), 'Escape restores focus to the feedback invitation');
    check(await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), 'Closing feedback restores page scrolling');
    await invitation.click();
    await feedback.waitFor();
    await page.waitForFunction(() => document.activeElement?.textContent === 'We’re listening.');
    check(await textarea.inputValue() === draft, 'Closing and reopening preserves an unsent draft');
    await feedback.getByRole('button', { name: 'Close feedback', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    check(await feedback.evaluate(node => node.contains(document.activeElement)), 'Shift+Tab remains inside the dialog');
    await feedback.locator('button:enabled:visible').last().focus();
    await page.keyboard.press('Tab');
    check(await feedback.getByRole('button', { name: 'Close feedback', exact: true }).evaluate(node => document.activeElement === node), 'Tab wraps from the last control to the close button');
    await textarea.fill('four');
    await feedback.getByRole('button', { name: 'Send feedback', exact: true }).click();
    check(bodies.length === 0, 'Native minimum length prevents an empty/too-short network send');
    await textarea.fill(draft);
    await feedback.getByRole('button', { name: 'Send feedback', exact: true }).click();
    const pending = feedback.getByRole('button', { name: 'Sending…', exact: true });
    await pending.waitFor();
    check(await pending.isDisabled(), 'Pending submit is visibly disabled');
    check((await feedback.locator('.site-feedback-status [role="status"]').textContent()).includes('Sending your feedback'), 'Pending feedback is announced immediately');
    check(await textarea.inputValue() === draft, 'Typed text remains during the held request');
    check(await textarea.getAttribute('readonly') !== null, 'Pending draft cannot be changed behind the submitted request');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Open feedback creates no horizontal overflow');
    const box = await textarea.boundingBox();
    check(box && box.width <= viewport.width && box.x >= 0 && box.x + box.width <= viewport.width, 'Textarea stays within the viewport width');
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
    await feedback.getByRole('button', { name: 'Close feedback', exact: true }).click();
    await feedback.waitFor({ state: 'detached' });
    await invitation.click();
    await feedback.waitFor();
    check(await textarea.inputValue() === draft, 'Closing and reopening after a failure retains the draft');
    await feedback.getByRole('button', { name: 'Try again', exact: true }).click();
    const savedDialog = page.getByRole('dialog', { name: 'That’s in. Thank you.', exact: true });
    await savedDialog.waitFor();
    await savedDialog.getByRole('button', { name: 'Write another', exact: true }).waitFor();
    check(bodies.length === 2 && bodies[0] === bodies[1], 'Retry reuses the same payload and idempotency identifier');
    const thanks = savedDialog.getByRole('heading', { name: 'That’s in. Thank you.', exact: true });
    await page.waitForFunction(() => document.activeElement?.textContent === 'That’s in. Thank you.');
    check(await thanks.evaluate(node => document.activeElement === node), 'Success moves focus to the acknowledgement');
    check(await savedDialog.locator('form').count() === 0, 'A saved message cannot be submitted again');
    await savedDialog.locator('[data-feedback-id="104"]').waitFor();
    check((await savedDialog.locator('[data-feedback-id="104"] .feedback-post-message').textContent()) === draft, 'The saved idea appears in the same dialog without navigation');
    await savedDialog.locator('img').evaluate(image => image.decode());
    check(await savedDialog.locator('img').evaluate(image => image.complete && image.naturalWidth > 0), 'Success uses the existing stamp artwork');
    check(await savedDialog.evaluate(node => node.getAnimations({ subtree: true }).every(animation => animation.playState !== 'running' || Number(animation.effect.getTiming().duration) <= 1)), 'Reduced motion shows a static success acknowledgement');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Feedback creates no horizontal overflow');
    await page.screenshot({ path: `${out}/saved-${viewport.width}x${viewport.height}.png`, fullPage: true });
    if (viewport.width === 390) await savedDialog.screenshot({ path: `${out}/feedback-saved-mobile.png` });
    await savedDialog.getByRole('button', { name: 'Back to games', exact: true }).click();
    await savedDialog.waitFor({ state: 'detached' });
    check(await invitation.evaluate(node => document.activeElement === node), 'The success action restores focus to the invitation');
    await invitation.click();
    await savedDialog.waitFor();
    check(await savedDialog.locator('form').count() === 0, 'Reopening preserves the sent acknowledgement');
    await savedDialog.getByRole('button', { name: 'Write another', exact: true }).click();
    await feedback.waitFor();
    await page.waitForFunction(() => document.activeElement?.tagName === 'TEXTAREA');
    check(await textarea.inputValue() === '', 'Writing another starts a fresh draft explicitly');
    check(await textarea.evaluate(node => document.activeElement === node), 'Write another restores focus to the textarea');
    check(errors.length === 0, `No client exceptions: ${errors.join('; ')}`);
    results.push({ viewport, interceptedActionPosts: bodies.length, writes: 0, draftPreserved: true, retryIdempotencyPreserved: true });
    console.log(`site feedback ${viewport.width}x${viewport.height}: pending, failure, retry and success passed`);
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    let posts = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (route.request().method() !== 'POST') return route.continue();
      if (!route.request().headers()['next-action']) return route.abort('blockedbyclient');
      const input = JSON.parse(route.request().postData() ?? 'null')?.[0];
      if (input?.limit === 20) return respond(route, { success: true, items: [], nextBeforeId: null });
      if (Array.isArray(input)) return respond(route, true);
      if (typeof input?.message !== 'string') return route.abort('blockedbyclient');
      posts++;
      return respond(route, { success: true });
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const invitation = page.getByRole('button', { name: 'Give feedback', exact: true });
    const invitationAnimations = await invitation.evaluate(node => {
      const animations = node.getAnimations({ subtree: true });
      for (const animation of animations) { animation.pause(); animation.currentTime = 250; }
      return animations.length;
    });
    check(invitationAnimations > 0, 'Normal motion animates the megaphone invitation');
    await invitation.locator('img').evaluate(image => image.decode());
    check(await invitation.locator('.site-feedback-copy').evaluate(node => node.getAnimations({ subtree: true }).length === 0), 'Invitation text stays still while the artwork moves');
    await invitation.screenshot({ path: `${out}/motion-invitation-250ms.png` });
    await invitation.click();
    const composer = page.getByRole('dialog', { name: 'We’re listening.', exact: true });
    await composer.getByRole('textbox', { name: 'What should we improve?', exact: true }).fill('[QA intercepted only] The clay artwork makes the feedback easy to find.');
    await composer.getByRole('button', { name: 'Send feedback', exact: true }).click();
    const saved = page.getByRole('dialog', { name: 'That’s in. Thank you.', exact: true });
    await saved.waitFor();
    const stampAnimations = await saved.evaluate(node => {
      const animations = node.getAnimations({ subtree: true });
      for (const animation of animations) { animation.pause(); animation.currentTime = 286; }
      return animations.filter(animation => animation.animationName === 'feedback-stamp').length;
    });
    check(stampAnimations === 1, 'A single stamp animation acknowledges successful saving');
    await saved.locator('img').evaluate(image => image.decode());
    const contactTransform = await saved.locator('.site-feedback-stamp .clay-object').evaluate(node => getComputedStyle(node).transform);
    await saved.screenshot({ path: `${out}/motion-stamp-contact-286ms.png` });
    await saved.evaluate(node => { for (const animation of node.getAnimations({ subtree: true })) animation.currentTime = 680; });
    const settledTransform = await saved.locator('.site-feedback-stamp .clay-object').evaluate(node => getComputedStyle(node).transform);
    check(contactTransform !== settledTransform, 'The stamp makes contact and then settles into its final position');
    check(await saved.locator('.site-feedback-dialog-title').evaluate(node => node.getAnimations().length === 0), 'The thank-you text remains still');
    await saved.screenshot({ path: `${out}/motion-stamp-settled-680ms.png` });
    check(posts === 1 && errors.length === 0, 'Motion flow sends one intercepted request with no client errors');
    results.push({ viewport: { width: 390, height: 844 }, motion: 'normal', interceptedActionPosts: posts, writes: 0 });
    await context.close();
  }
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, noDatabaseWrites: true, results }, null, 2) + '\n');
  console.log(`check-site-feedback-ui: ${checks} checks passed; all POSTs intercepted`);
} finally { await browser.close(); }
