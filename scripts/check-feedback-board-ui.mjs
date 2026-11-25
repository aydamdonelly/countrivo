// Local UI regression. Every POST is intercepted; no feedback, votes or analytics are written.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { publicFeedback } = require('../src/lib/feedback-board.ts');
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local QA only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const out = '.check-render/feedback-board';
mkdirSync(out, { recursive: true });
let checks = 0;
const reports = [];
function check(ok, label) { assert(ok, label); checks++; }
async function until(test, label) {
  const deadline = Date.now() + 10000;
  while (!test()) {
    assert(Date.now() < deadline, label);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
const respond = (route, value) => route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n` });
function deferred() { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; }
const secrets = ['PRIVATE_DEVICE_48e147', 'https://private.example/account?token=PRIVATE_URL_482', 'PRIVATE_SUBMISSION_912'];
function item(id, message, source = 'player') {
  const projected = publicFeedback({ id, message, scope: 'site', context: 'site', game_slug: null, created_at: '2026-10-28T10:00:00Z', source,
    upvotes: 2, downvotes: 1, vote: 0, device_id: secrets[0], page_url: secrets[1], submission_id: secrets[2] });
  check(projected && secrets.every(secret => !JSON.stringify(projected).includes(secret)), 'Public DTO strips private identifiers and page URLs');
  return projected;
}
const longMessage = 'A long anonymous idea should remain readable, including an uninterrupted word.\n' + 'x'.repeat(1421);
check(longMessage.length === 1500, 'Long-message fixture exercises the full allowed length');

async function setup(width, { clock = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  if (clock) await page.clock.install();
  const errors = [], queries = [], votes = [], submissions = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = { feed: 'empty', failLoad: false, failVote: false, holdVote: null, holdLoad: null, long: false,
    items: [item(103, 'Let me compare my Blind Pick choices with the best arrangement.'), item(102, 'Keep the game cards and their transitions consistent.', 'reviewed')],
    older: [item(80, 'Please keep the category units visible while I play.')] };
  await page.route('**/*', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    if (!route.request().headers()['next-action']) return route.abort('blockedbyclient');
    let args;
    try { args = JSON.parse(route.request().postData() ?? 'null'); } catch { return route.abort('blockedbyclient'); }
    const input = args?.[0];
    if (Array.isArray(input)) return respond(route, true);
    if (typeof input?.message === 'string') {
      submissions.push(input);
      state.items.unshift(item(104, input.message)); state.feed = 'items';
      return respond(route, { success: true });
    }
    if (typeof input?.feedbackId === 'number') {
      votes.push(input);
      const held = state.holdVote; state.holdVote = null;
      if (held) await held.promise;
      if (state.failVote) { state.failVote = false; return respond(route, { success: false, code: 'unavailable', error: 'Local vote failure. Your previous vote is unchanged. Try again.' }); }
      const current = [...state.items, ...state.older].find(row => row.id === input.feedbackId);
      assert(current, 'Vote targets a fixture row');
      current.upvotes += Number(input.value === 1) - Number(current.vote === 1);
      current.downvotes += Number(input.value === -1) - Number(current.vote === -1);
      current.vote = input.value; current.score = current.upvotes - current.downvotes;
      return respond(route, { success: true, item: current });
    }
    if (input?.limit === 20) {
      queries.push(input);
      if (state.failLoad) { state.failLoad = false; return respond(route, { success: false, error: 'Local refresh failure. Your previous feed is still here.' }); }
      if (state.feed === 'empty') return respond(route, { success: true, items: [], nextBeforeId: null });
      const older = typeof input.beforeId === 'number';
      const items = older ? state.older : state.long ? [item(101, longMessage)] : state.items;
      const reply = structuredClone({ success: true, items, nextBeforeId: older || state.long ? null : 102 });
      const held = state.holdLoad; state.holdLoad = null;
      if (held) await held.promise;
      return respond(route, reply);
    }
    return route.abort('blockedbyclient');
  });
  await page.goto(`${base}/feedback`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const button = document.querySelector('.feedback-feed-heading button'); return button && Object.keys(button).some(key => key.startsWith('__reactProps')); });
  // The first mocked refresh makes the empty state independent of the local SSR database snapshot.
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('heading', { name: 'Be the first to share an idea.', exact: true }).waitFor();
  return { context, page, errors, queries, votes, submissions, state };
}

async function scenario(width) {
  const { context, page, errors, queries, votes, submissions, state } = await setup(width);
  check(await page.locator('.feedback-post').count() === 0, 'Empty board shows no fabricated posts');
  check(await page.getByRole('button', { name: 'Give feedback', exact: true }).count() === 1, 'Board offers one prominent composer');
  await page.screenshot({ path: `${out}/empty-${width}.png`, fullPage: true });
  const invitation = page.getByRole('button', { name: 'Give feedback', exact: true });
  await invitation.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'We’re listening.', exact: true });
  await dialog.waitFor();
  check((await dialog.textContent()).includes('Public and anonymous'), 'Composer clearly discloses public anonymous posting');
  const textarea = dialog.getByRole('textbox', { name: 'What should we improve?', exact: true });
  await page.waitForFunction(() => document.activeElement?.textContent === 'We’re listening.');
  check(await dialog.getByRole('heading', { name: 'We’re listening.', exact: true }).evaluate(node => node === document.activeElement), 'Keyboard opening focuses the dialog heading');
  check(await dialog.getByRole('heading', { name: 'Community feedback', exact: true }).isVisible(), 'Public board is directly below the form in the same dialog');
  check(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(node => node.id); return new Set(ids).size === ids.length; }), 'Standalone and modal boards have no duplicate element IDs');
  await textarea.fill('[Local fixture only] Make every country category easier to understand.');
  await page.screenshot({ path: `${out}/composer-${width}.png`, fullPage: true });
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  const success = page.getByRole('dialog', { name: 'That’s in. Thank you.', exact: true });
  await success.waitFor();
  await success.locator('[data-feedback-id="104"]').waitFor({ state: 'attached' });
  check(submissions.length === 1 && submissions[0].visibility === 'public', 'Composer sends exactly one explicitly public submission');
  check(submissions[0].scope === 'site' && submissions[0].context === 'site', 'Board composer has site context');
  check(queries.length >= 2, 'Successful submission refreshes the public feed');
  check((await success.textContent()).includes('Everyone can read it and vote'), 'Success confirms public visibility');
  const modalPost = success.locator('[data-feedback-id="104"]');
  const modalUp = modalPost.getByRole('button', { name: /^Upvote,/ });
  await modalUp.click();
  await page.waitForFunction(() => document.querySelector('[role="dialog"] [data-feedback-id="104"] button')?.getAttribute('aria-pressed') === 'true' && !document.querySelector('[role="dialog"] [data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  check(await modalUp.getAttribute('aria-label') === 'Upvote, 3 votes', 'A new idea can be voted on inside the same dialog');
  await modalUp.click();
  await page.waitForFunction(() => document.querySelector('[role="dialog"] [data-feedback-id="104"] button')?.getAttribute('aria-pressed') === 'false' && !document.querySelector('[role="dialog"] [data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  check(await modalUp.getAttribute('aria-label') === 'Upvote, 2 votes', 'The modal supports removing a vote without navigation');
  await page.screenshot({ path: `${out}/unified-saved-${width}.png`, fullPage: true });
  const priorVotes = votes.length;
  await success.getByRole('button', { name: 'Close feedback', exact: true }).click();
  await success.waitFor({ state: 'detached' });
  check(await invitation.evaluate(node => node === document.activeElement), 'Closing the composer restores keyboard focus');
  check(await page.getByText('Earlier feedback · anonymous summary', { exact: false }).count() === 1, 'Reviewed history is labelled as an anonymous summary');
  const post = page.locator('[data-feedback-id="104"]');
  const up = post.getByRole('button', { name: /^Upvote,/ });
  const down = post.getByRole('button', { name: /^Downvote,/ });
  const hold = deferred(); state.holdVote = hold;
  await up.evaluate(node => { node.click(); node.click(); });
  await post.locator('button[aria-pressed="true"]').waitFor();
  await page.waitForFunction(() => document.querySelector('[data-feedback-id="104"]')?.getAttribute('aria-busy') === 'true');
  check(await up.getAttribute('aria-label') === 'Upvote, 3 votes', 'Upvote updates its count immediately');
  check(await up.getAttribute('aria-pressed') === 'true', 'Optimistic selection is accessible');
  check(await page.locator('.feedback-votes button:not(:disabled)').count() === 0, 'Pending vote prevents concurrent votes');
  check(await page.getByRole('button', { name: 'Refresh', exact: true }).isDisabled(), 'Pending vote cannot race a manual refresh');
  check(votes.length === priorVotes + 1, 'A rapid double click sends one vote request');
  await page.screenshot({ path: `${out}/vote-pending-${width}.png`, fullPage: true });
  hold.release();
  await page.waitForFunction(() => !document.querySelector('[data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  await up.click();
  await page.waitForFunction(() => document.querySelector('[data-feedback-id="104"] button')?.getAttribute('aria-pressed') === 'false' && !document.querySelector('[data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  check(votes.at(-1).value === 0 && await up.getAttribute('aria-label') === 'Upvote, 2 votes', 'Tapping the selected vote removes it');
  await down.focus(); await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelectorAll('[data-feedback-id="104"] button')[1]?.getAttribute('aria-pressed') === 'true' && !document.querySelector('[data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  check(votes.at(-1).value === -1 && await down.getAttribute('aria-label') === 'Downvote, 2 votes', 'Keyboard downvote is saved');
  state.failVote = true;
  await up.click();
  await page.locator('.feedback-board-error').waitFor();
  check(await down.getAttribute('aria-pressed') === 'true' && await up.getAttribute('aria-label') === 'Upvote, 2 votes', 'Failed switch rolls back the previous vote and counts');
  await up.click();
  await page.waitForFunction(() => document.querySelector('[data-feedback-id="104"] button')?.getAttribute('aria-pressed') === 'true' && !document.querySelector('[data-feedback-id="104"]')?.hasAttribute('aria-busy'));
  check(await down.getAttribute('aria-label') === 'Downvote, 1 votes', 'Retry switches direction without retaining both votes');
  check(votes.every(vote => /^[0-9a-f-]{36}$/.test(vote.requestId)), 'Every vote carries a request identifier');
  state.failLoad = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.locator('.feedback-board-error').waitFor();
  check(await page.locator('[data-feedback-id="104"]').count() === 1, 'Failed refresh retains the last readable feed');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.locator('.feedback-board-error').waitFor({ state: 'detached' });
  check(await up.getAttribute('aria-label') === 'Upvote, 3 votes', 'Refresh retry returns confirmed counts');
  await page.screenshot({ path: `${out}/feed-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Older feedback', exact: true }).click();
  await page.locator('[data-feedback-id="80"]').waitFor();
  check(queries.at(-1).beforeId === 102, 'Pagination sends the returned cursor');
  check(await page.locator('[data-feedback-id="104"]').count() === 0, 'Older page replaces the newest page');
  check(await page.getByRole('heading', { name: 'Community feedback', exact: true }).evaluate(node => node === document.activeElement), 'Pagination moves keyboard focus to the board heading');
  check(await page.getByRole('button', { name: 'Older feedback', exact: true }).count() === 0, 'Last page has no fabricated next page');
  await page.getByRole('button', { name: 'Back to newest', exact: true }).click();
  await page.locator('[data-feedback-id="104"]').waitFor();
  check(typeof queries.at(-1).beforeId !== 'number', 'Back to newest clears the cursor');
  state.long = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.locator('[data-feedback-id="101"]').waitFor();
  check((await page.locator('[data-feedback-id="101"] .feedback-post-message').textContent()).length === 1500, 'A full-length message is shown without truncation');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Long messages do not cause horizontal overflow');
  const visible = await page.locator('body').textContent();
  check(secrets.every(secret => !visible.includes(secret)), 'Private URLs and identifiers never render');
  check(errors.length === 0, `No browser exceptions: ${errors.join('; ')}`);
  await page.screenshot({ path: `${out}/long-${width}.png`, fullPage: true });
  reports.push({ width, interceptedSubmissions: submissions.length, interceptedVotes: votes.length, interceptedQueries: queries.length, writes: 0 });
  await context.close();
}

async function refreshTiming() {
  const { context, page, queries, votes, state, errors } = await setup(390, { clock: true });
  state.feed = 'items';
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.locator('[data-feedback-id="103"]').waitFor();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1));
  let count = queries.length;
  await page.clock.fastForward(15000);
  await until(() => queries.length > count, 'The scheduled refresh reaches transport');
  await page.clock.runFor(50);
  check(queries.length === count + 1, 'Visible idle board refreshes on the 15-second timer');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  count = queries.length;
  await page.clock.fastForward(30000);
  check(queries.length === count, 'Hidden board pauses automatic refresh');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await until(() => queries.length > count, 'Visibility refresh reaches transport');
  await page.clock.runFor(50);
  check(queries.length === count + 1, 'Returning to a visible board refreshes it');
  await page.getByRole('button', { name: 'Give feedback', exact: true }).evaluate(node => node.click());
  await page.clock.runFor(100);
  await page.getByRole('dialog').locator('[data-feedback-id="103"]').waitFor();
  count = queries.length;
  state.items.unshift(item(105, 'A new idea arrives while the feedback dialog stays open.'));
  await page.clock.fastForward(15000);
  await until(() => queries.length > count, 'The modal refresh reaches transport');
  await page.clock.runFor(100);
  check(queries.length === count + 1, 'Only the visible modal feed polls while the standalone feed is behind it');
  check(await page.getByRole('dialog').locator('[data-feedback-id="105"]').count() === 1, 'New feedback appears live inside the open dialog');
  await page.getByRole('dialog').getByRole('textbox', { name: 'What should we improve?', exact: true }).focus();
  count = queries.length;
  await page.clock.fastForward(30000);
  check(queries.length === count, 'Typing in the composer pauses polling without hiding the board');
  await page.getByRole('button', { name: 'Close feedback', exact: true }).evaluate(node => node.click());
  await page.clock.runFor(100);
  const hold = deferred(); state.holdVote = hold;
  await page.locator('[data-feedback-id="103"]').getByRole('button', { name: /^Upvote,/ }).evaluate(node => node.click());
  await page.clock.runFor(1);
  count = queries.length;
  await page.clock.fastForward(30000);
  check(votes.length === 1 && queries.length === count, 'Pending vote pauses automatic refresh and does not resubmit');
  hold.release();
  await page.clock.resume();
  await page.waitForFunction(() => !document.querySelector('[data-feedback-id="103"]')?.hasAttribute('aria-busy'));
  const oldRead = deferred(), newVote = deferred();
  state.holdLoad = oldRead; state.holdVote = newVote;
  count = queries.length;
  await page.clock.fastForward(15000);
  await until(() => queries.length > count, 'Background read is held before voting');
  const post = page.locator('[data-feedback-id="103"]');
  const down = post.getByRole('button', { name: /^Downvote,/ });
  await down.evaluate(node => node.click());
  check(await down.getAttribute('aria-pressed') === 'true' && await post.getAttribute('aria-busy') === 'true', 'An outstanding background read does not block optimistic voting');
  oldRead.release();
  await until(() => votes.length === 2, 'New vote reaches transport after the older read');
  await page.clock.runFor(50);
  check(await down.getAttribute('aria-pressed') === 'true' && await down.getAttribute('aria-label') === 'Downvote, 2 votes', 'Stale background response cannot overwrite the new optimistic vote');
  newVote.release();
  await page.waitForFunction(() => !document.querySelector('[data-feedback-id="103"]')?.hasAttribute('aria-busy'));
  check(await down.getAttribute('aria-pressed') === 'true', 'The newer vote remains selected after confirmation');
  check(errors.length === 0, `Timer scene has no browser exceptions: ${errors.join('; ')}`);
  reports.push({ timers: true, interceptedVotes: votes.length, interceptedQueries: queries.length, writes: 0 });
  await context.close();
}

try {
  for (const width of [320, 390, 1440]) await scenario(width);
  await refreshTiming();
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, noDatabaseWrites: true, reports }, null, 2) + '\n');
  console.log(`Feedback board UI: ${checks} checks passed; all POSTs intercepted, no writes.`);
} finally { await browser.close(); }
