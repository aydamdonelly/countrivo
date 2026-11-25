// Local browser walkthrough of the Flag Quiz sprint. Every server action POST is intercepted
// and answered with views built from the pure sprint engine, so no move reaches the database.
// The page GETs read only: today's practice board and the frozen daily snapshot.
//
// Run against a local production build:
//   ./node_modules/.bin/next build && ./node_modules/.bin/next start -p 3310
//   PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs npx tsx scripts/check-flag-sprint-ui.mjs
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

process.env.COUNTRIVO_GAME_SECRET ??= 'offline-fixture-secret-0123456789abcdef';
const require = createRequire(import.meta.url);
const load = Module._load;
Module._load = function (name, parent, main) { return name === 'server-only' ? {} : load.call(this, name, parent, main); };
const sprint = require('../src/lib/game-logic/flag-quiz/sprint.ts');
const { sprintView } = require('../src/server/quick-sessions.ts');
const { countryOf } = require('../src/lib/game-logic/flag-quiz/engine.ts');
const { mulberry32 } = require('../src/lib/seeded-random.ts');
const { getTodayDateKey } = require('../src/lib/daily-seed.ts');
Module._load = load;

const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3310';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const out = process.env.FLAG_SPRINT_SHOTS ?? '.check-render/flag-sprint';
mkdirSync(out, { recursive: true });
const day = getTodayDateKey();
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };

/** A sprint view as the server would send it, with a public flag path so the fixture renders. */
function fixture(state, mode) {
  const view = sprintView(state, mode, day);
  const flag = sprint.currentFlag(state);
  return { ...view, flagSrc: flag ? `/flags/${countryOf(flag.iso3).iso2.toLowerCase()}.svg` : null };
}

function respond(route, value) {
  return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n` });
}

function runFor(state, mode) {
  const correct = sprint.correctCount(state);
  return { id: 900000777, gameSlug: 'flag-quiz', mode, dailyDate: mode === 'daily' ? day : null, scoreRaw: correct, scoreMax: 60, scoreDisplay: sprint.flagsLabel(correct), scoreSortValue: correct, scoreNormalized: correct / 60,
    rankDaily: null, percentile: null, isPersonalBest: false, resultJson: { qaFixture: true }, completedAt: new Date().toISOString(), dailyNameCount: 5, rankPreview: { rank: 2, playerCount: 6 },
    leaderboard: { available: true, playerCount: 5, entries: [{ runId: 111, displayName: 'Atlas Player', scoreDisplay: `${correct + 2} flags`, scoreSortValue: correct + 2, rank: 1 }, { runId: 112, displayName: 'River Player', scoreDisplay: sprint.flagsLabel(correct), scoreSortValue: correct, rank: 2 }, { runId: 113, displayName: 'Coast Player', scoreDisplay: `${Math.max(0, correct - 3)} flags`, scoreSortValue: Math.max(0, correct - 3), rank: 4 }] } };
}

/** Answers every POST from the engine: start, answers (every third one wrong), finish. */
function engineServer(mode, { finishAfter = Infinity, onPost } = {}) {
  let state = sprint.createSprint(mulberry32(mode === 'daily' ? 20261126 : 777));
  let revision = 0;
  const posts = [];
  const handler = async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') return route.continue();
    if (!request.headers()['next-action']) return route.fulfill({ status: 204 });
    const body = JSON.parse(request.postData() ?? '[]');
    const action = body[0]?.action ?? { t: '?' };
    posts.push(action.t);
    const now = Date.now();
    if (action.t === 'start' || action.t === 'finish') state = sprint.reduceSprint(state, { t: action.t, at: now });
    else if (action.t === 'answer') {
      const flag = sprint.currentFlag(state);
      const pick = flag && state.answers.length % 3 === 2 ? (flag.correctIndex + 1) % 4 : flag?.correctIndex ?? 0;
      state = sprint.reduceSprint(state, { t: 'answer', i: pick, at: now });
      if (state.answers.length >= finishAfter && !sprint.sprintDone(state)) state = sprint.reduceSprint(state, { t: 'finish', at: now });
    }
    // Any other move (a tap on a frozen ten-flag board) is answered with the sprint as it stands.
    revision++;
    onPost?.(action);
    const done = sprint.sprintDone(state);
    return respond(route, { success: true, view: fixture(state, mode), revision, sessionToken: `fixture-${revision}`, ...(done ? { run: runFor(state, mode), publishedName: null } : {}) });
  };
  return { handler, posts, state: () => state };
}

async function shot(page, name) {
  const path = `${out}/${name}.png`;
  // The result number counts up over 600 ms; capture the settled card.
  if (await page.locator('.rp').count()) await page.waitForTimeout(900);
  if (await page.locator('.fs-box img').count()) {
    await page.waitForFunction(() => { const image = document.querySelector('.fs-box img'); return image?.complete && image.naturalWidth > 0; });
    check(true, `${name}: the flag on screen has loaded`);
  }
  await page.screenshot({ path, fullPage: false });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
  return path;
}

const shots = [];
try {
  // ── practice: the real ready card, a fixture run, the clock running out on its own ──
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const server = engineServer('practice');
    await page.route('**/*', server.handler);
    await page.goto(`${base}/games/flag-quiz/play?mode=practice`, { waitUntil: 'networkidle' });
    const start = page.getByRole('button', { name: 'Start', exact: true });
    check(await start.isVisible(), 'practice: the first HTML is the ready card with Start');
    check((await page.locator('.fs-chips').innerText()).includes('2 s'), 'practice: the ready card states the penalty');
    check(await page.locator('.fs-box img').count() === 0, 'practice: no flag before the start');
    shots.push(await shot(page, 'practice-ready'));
    await start.click();
    await page.locator('.fs-box img').waitFor();
    for (let k = 0; k < 4; k++) {
      await page.locator('.fs-opt:not([disabled])').first().waitFor();
      await page.locator('.fs-opt').nth(k % 4).click();
      await page.waitForFunction(() => document.querySelectorAll('.fs-opt[aria-pressed="true"]').length === 0);
    }
    check(Number(await page.locator('.fs-count b').innerText()) >= 1, 'practice: right answers count up');
    check((await page.locator('.fs-last').innerText()).length > 1, 'practice: the last answer is acknowledged');
    const clock = Number(await page.locator('.fs-clock b').innerText());
    check(clock > 0 && clock <= 20, `practice: the countdown runs from the server deadline (${clock} s)`);
    shots.push(await shot(page, 'practice-mid-sprint'));
    // Let the clock run out: the board must send `finish` by itself and open the result.
    await page.locator('.rp').waitFor({ timeout: 25_000 });
    check(server.posts.at(-1) === 'finish', 'practice: the board closes the run when its countdown reaches zero');
    check(server.posts.filter(t => t === 'finish').length === 1, 'practice: exactly one finish move');
    check(await page.getByRole('button', { name: 'One more', exact: true }).isVisible(), 'practice: One more is offered');
    check((await page.locator('.fs-seen').innerText()).length > 0, 'practice: the flags seen are listed');
    await page.locator('.qr-result').scrollIntoViewIfNeeded();
    shots.push(await shot(page, 'practice-result'));
    assert.deepEqual(errors, [], 'practice: no page errors'); checks++;
    await context.close();
  }

  // ── daily: the frozen ten-flag board of today hands over to a fixture sprint ──
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const server = engineServer('daily', { finishAfter: 11 });
    await page.route('**/*', server.handler);
    await page.goto(`${base}/games/flag-quiz/play`, { waitUntil: 'networkidle' });
    const legacy = await page.locator('.fq-opt').count();
    if (legacy) {
      shots.push(await shot(page, 'daily-today-frozen-ten-flag-board'));
      await page.locator('.fq-opt').first().click();
    }
    const start = page.getByRole('button', { name: 'Start', exact: true });
    await start.waitFor();
    check((await page.locator('.fs-ready').innerText()).includes('Same flags for everyone today'), 'daily: the ready card says everyone gets the same flags');
    shots.push(await shot(page, 'daily-start'));
    await start.click();
    await page.locator('.fs-box img').waitFor();
    for (let k = 0; k < 5; k++) {
      await page.locator('.fs-opt:not([disabled])').first().waitFor();
      await page.locator('.fs-opt').nth(1).click();
      if (k === 2) {
        await page.locator('.fs-penalty').waitFor();
        check((await page.locator('.fs-penalty').innerText()).includes('That was'), 'daily: a miss names the right country and the penalty');
        shots.push(await shot(page, 'daily-after-wrong'));
      }
    }
    await page.locator('.fs-opt:not([disabled])').first().waitFor();
    shots.push(await shot(page, 'daily-mid-sprint'));
    while (!(await page.locator('.rp').count())) {
      const option = page.locator('.fs-opt:not([disabled])').first();
      if (await option.count()) await option.click().catch(() => {});
      await page.waitForTimeout(60);
    }
    await page.locator('.rp').waitFor();
    const score = await page.locator('.rp .score').innerText();
    check(/flags/.test(score), `daily: the result reads in flags (${score.replace(/\s+/g, ' ')})`);
    check((await page.locator('.rc-facts').innerText()).includes('8'), 'daily: the facts row shows the daily target of 8');
    check((await page.locator('.rp-score-label').innerText()).trim() === 'flags', 'daily: the unit line reads flags');
    check(await page.locator('.rp-wrap > .a-card').evaluate(node => !!node.nextElementSibling?.matches('.a-lb') && !!node.nextElementSibling.nextElementSibling?.matches('.a-next') && !!node.nextElementSibling.nextElementSibling.querySelector(':scope > .daily-result-next')), 'daily: the leaderboard follows the score card, then the next daily');
    check(await page.evaluate(() => [...document.querySelectorAll('button, a')].filter(node => node.checkVisibility() && /^share/i.test(node.textContent.trim())).length) === 1, 'daily: exactly one share action');
    shots.push(await shot(page, 'daily-result'));
    await page.locator('.fs-seen').scrollIntoViewIfNeeded();
    shots.push(await shot(page, 'daily-result-flags'));
    assert.deepEqual(errors, [], 'daily: no page errors'); checks++;
    await context.close();
  }
  console.log(`check-flag-sprint-ui: ${checks} checks passed; every action POST answered by fixtures`);
  for (const path of shots) console.log(`  ${path}`);
} finally {
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]);
}
process.exit(0);
