// Local-only integration fixtures; all action POSTs are intercepted, never persisted.
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const load = Module._load;
Module._load = function (name, parent, main) { return name === 'server-only' ? {} : load.call(this, name, parent, main); };
const { gameModule: higher } = require('../src/games/higher-or-lower/module.ts');
const { higherView } = require('../src/server/quick-sessions.ts');
const { gameModule: geo } = require('../src/games/geo-wordle/module.ts');
const { geoWordleView } = require('../src/lib/game-logic/geo-wordle/engine.ts');
const { createGame, openCountry, appoint, nextRound } = require('../src/lib/game-logic/country-draft/engine.ts');
const { draftView } = require('../src/lib/game-logic/country-draft/public-view.ts');
const { getTodayDateKey } = require('../src/lib/daily-seed.ts');
Module._load = load;

const day = getTodayDateKey();
let higherState = higher.create(73, 'daily', day);
while (!higher.done(higherState)) higherState = higher.reduce(higherState, higherState.rev ? {t: 'advance', ui: true} : {t: 'guess', c: 'higher'});
const geoState = geo.create(73, 'daily', day);
const geoFinished = geo.reduce(geoState, {t: 'guess', iso3: geoState.answerIso3});
let draftState = createGame(73);
for (let seat = 0; seat < 5; seat++) draftState = nextRound(appoint(openCountry(draftState, 0), 0, seat));
const draft = draftView(draftState);
const scenarios = [
  {slug: 'higher-or-lower', view: higherView(higherState, 'daily', day), control: '.qr-call', score: higher.scoreLabel(higherState), raw: 8, max: 13},
  {slug: 'geo-wordle', view: geoWordleView(geoFinished), control: '.gw-input button', score: '1/6', raw: 1, max: 6},
  {slug: 'country-draft', view: draft, control: '.dr-country-card', score: `${draft.score} / 195`, raw: draft.score, max: 195},
];
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check is local only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out = '.check-render/result-layout';
mkdirSync(out, {recursive: true});
const viewports = [{width: 320, height: 568}, {width: 390, height: 844}, {width: 768, height: 1024}, {width: 1440, height: 900}, {width: 844, height: 390}];
const longName = 'QAWWWWWWWWWWWWWWWWWW';
const results = [];
let checks = 0;
function check(value, label) { assert(value, label); checks++; }
function runFor(scenario, id) {
  return {id, gameSlug: scenario.slug, mode: 'daily', dailyDate: day, scoreRaw: scenario.raw, scoreMax: scenario.max, scoreDisplay: scenario.score, scoreSortValue: scenario.raw, scoreNormalized: 50, rankDaily: null, percentile: null, isPersonalBest: false, resultJson: {qaFixture: true}, completedAt: new Date().toISOString(), dailyNameCount: 6, rankPreview: {rank: 3, playerCount: 7}, leaderboard: {available: true, playerCount: 6, entries: [{runId: 111, displayName: 'Atlas Player', scoreDisplay: 'Ahead', scoreSortValue: scenario.raw + 2, rank: 1, countryCode: 'DE'}, {runId: 112, displayName: 'River Player', scoreDisplay: 'Ahead', scoreSortValue: scenario.raw + 1, rank: 2}, {runId: 113, displayName: 'Coast Player', scoreDisplay: 'Behind', scoreSortValue: scenario.raw - 1, rank: 4}]}};
}
function respond(route, value) { return route.fulfill({status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`}); }
async function fits(page, label) { check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`); }

try {
  for (const viewport of viewports) {
    for (const [index, scenario] of scenarios.entries()) {
      const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
      await context.addInitScript(name => localStorage.setItem('countrivo_leaderboard_name', JSON.stringify(name)), longName);
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let posts = 0;
      await page.route('**/*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        if (!route.request().headers()['next-action']) return route.fulfill({status: 204});
        posts++;
        if (posts === 2 && scenario.slug === 'higher-or-lower') return respond(route, {success: true, publishedName: longName, run: {...runFor(scenario, 900000000 + index), rankDaily: 3, dailyNameCount: 7}});
        if (posts > 1) return route.abort('blockedbyclient');
        return respond(route, {success: true, view: scenario.view, revision: 50, sessionToken: 'qa-layout-fixture', run: runFor(scenario, 900000000 + index), publishedName: null});
      });
      await page.goto(`${base}/games/${scenario.slug}/play?mode=daily`, {waitUntil: 'networkidle'});
      if (scenario.slug === 'geo-wordle') await page.getByRole('combobox', {name: 'Country', exact: true}).fill('France');
      await page.locator(scenario.control).first().click();
      const entry = page.locator('.leaderboard-entry');
      await entry.waitFor();
      // 25 November 2026: the leaderboard sits right under the score card, then today's progress and the next daily.
      check(await page.locator('.rp-wrap > .a-card').first().evaluate(node => !!node.nextElementSibling?.matches('.a-lb') && !!node.nextElementSibling.nextElementSibling?.matches('.a-next') && !!node.nextElementSibling.nextElementSibling.querySelector(':scope > .daily-result-next')), `${scenario.slug}: the leaderboard follows the score card, then the next daily`);
      // 25 November 2026 design pass: one share, one primary, no game colour on any action.
      const actions = await page.evaluate(() => {
        const visible = [...document.querySelectorAll('button, a')].filter(node => node.checkVisibility());
        const pastels = ['draft', 'geo', 'pin', 'flag', 'higher', 'stat', 'blind', 'speed'].map(name => { const probe = document.createElement('span'); probe.style.backgroundColor = `var(--color-game-${name})`; document.body.append(probe); const colour = getComputedStyle(probe).backgroundColor; probe.remove(); return colour; });
        return {
          shares: visible.filter(node => /^share/i.test(node.textContent.trim())).length,
          // 26 November 2026: joining today's board ("Add me") is a primary ask of its own, beside the next game.
          primaries: visible.filter(node => node.matches('.btn-primary, .next-card') && !node.matches('.standing-join')).length,
          pastelButtons: visible.filter(node => node.matches('.btn') && pastels.includes(getComputedStyle(node).backgroundColor)).length,
        };
      });
      check(actions.shares === 1, `${scenario.slug}: exactly one share control (${actions.shares})`);
      check(actions.primaries <= 1, `${scenario.slug}: at most one primary action (${actions.primaries})`);
      check(actions.pastelButtons === 0, `${scenario.slug}: no button takes a game pastel`);
      check(await page.locator('.a-card .rc-plate').evaluate(node => getComputedStyle(node).backgroundColor !== getComputedStyle(document.body).backgroundColor), `${scenario.slug}: the clay plate carries the game colour`);
      const preceding = await entry.evaluate(node => {
        const before = selector => Array.from(document.querySelectorAll(selector)).some(other => !!(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING));
        return {nextGame: before('.daily-result-next'), bonus: before('.gw-bonus'), map: before('.dr-conquest-panel'), answerMap: before('.a-card .gw-answer-map'), review: before('.a-review')};
      });
      check(!preceding.nextGame, `${scenario.slug}: the leaderboard and naming precede the next daily`);
      check(!preceding.bonus && !preceding.map, `${scenario.slug}: no bonus or cabinet map precedes naming`);
      // Game clarity pass: the answer is in the card (GeoWordle: name, flag and map) and the per-round answers sit open between the next daily and the leaderboard.
      if (scenario.slug === 'geo-wordle') {
        check(preceding.answerMap && await page.locator('.a-card .gw-answer-map').isVisible(), 'geo-wordle: the answer map is visible inside the result card, not in a collapsed section');
        check((await page.locator('.a-card .gw-answer-kicker').textContent()) === 'You found' && (await page.locator('.a-card .gw-answer-name').textContent()).includes(scenario.view.answer.name), 'geo-wordle: the card names the answer with its flag');
      }
      if (scenario.slug !== 'geo-wordle') {
        check(!preceding.review, `${scenario.slug}: the leaderboard precedes the answers`);
        check(await page.locator('.a-review > details[open]').count() === 1, `${scenario.slug}: the answers are open by default`);
        check(await page.locator('.a-next').evaluate(node => !!node.nextElementSibling?.matches('.a-review')), `${scenario.slug}: the answers follow the next daily directly`);
      }
      const input = entry.getByRole('textbox', {name: 'Your name on the board (optional)', exact: true});
      check(await input.evaluate(node => !!node.closest('.join-panel form') && !node.closest('.standing-you')), 'The name field sits in the join panel, not inside the own row');
      check(await entry.evaluate(node => !!(node.querySelector('.join-panel').compareDocumentPosition(node.querySelector('.standing-list')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'The join panel sits above the list, so a long board never buries it');
      check(await entry.locator('.standing-you').evaluate(node => Array.from(node.parentElement.children).indexOf(node) === 2), 'The own score row sits between better and lower scores');
      // Section 4: neutral podium rows, distinct medals, your row ember, flag button before the name.
      const board = await entry.evaluate(node => {
        const probe = document.createElement('span'); probe.style.color = 'var(--color-ember)'; probe.style.backgroundColor = 'var(--color-you)'; node.append(probe);
        const tokens = getComputedStyle(probe); const ember = tokens.color, you = tokens.backgroundColor; probe.remove();
        const own = getComputedStyle(node.querySelector('.standing-you'));
        const row = node.querySelector('.join-row');
        return {
          podiumTransparent: [...node.querySelectorAll('.standing-row')].filter(r => r.querySelector('.rank-medal')).every(r => getComputedStyle(r).backgroundColor === 'rgba(0, 0, 0, 0)'),
          medals: [...node.querySelectorAll('.standing-list .rank-marker[data-podium]')].map(m => [m.dataset.podium, new URL(m.querySelector('img').src).pathname]),
          ownTint: own.backgroundColor === you && own.boxShadow.includes(ember) && own.boxShadow.includes('inset'),
          flagFirst: !!row && row.firstElementChild?.matches('.join-flag') && row.querySelector('.join-flag').compareDocumentPosition(row.querySelector('input')) === Node.DOCUMENT_POSITION_FOLLOWING,
          oneLine: !!row && new Set([...row.children].filter(c => c.matches('button, input')).map(c => Math.round(c.getBoundingClientRect().top))).size === 1,
        };
      });
      check(board.podiumTransparent, `${scenario.slug}: podium rows have a transparent background`);
      const medalArt = new Map(board.medals);
      check(medalArt.size === 3 && new Set(medalArt.values()).size === 3, `${scenario.slug}: medal images for places 1, 2 and 3 differ`);
      check(board.ownTint, `${scenario.slug}: your row has the ember tint and inset`);
      check(board.flagFirst, `${scenario.slug}: the flag button sits before the name input`);
      check(board.oneLine, `${scenario.slug}: flag, name and Save share one line`);
      await input.fill(longName);
      check(await input.inputValue() === longName, 'A20-character nickname remains editable');
      check(await input.getAttribute('maxlength') === '20', 'Nickname length matches the public limit');
      const submit = entry.getByRole('button', {name: 'Add me', exact: true});
      check(await submit.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Publishing CTA remains fully readable');
      await fits(page, `${scenario.slug} ${viewport.width}x${viewport.height}`);
      check(posts === 1, 'Result fixture uses one intercepted action and sends no publish/report action');
      check(errors.length === 0, `${scenario.slug}: no client exceptions: ${errors.join('; ')}`);
      await page.screenshot({path: `${out}/${scenario.slug}-${viewport.width}x${viewport.height}.png`, fullPage: true});
      if (scenario.slug === 'higher-or-lower') {
        await submit.click();
        await entry.locator('.join-done').waitFor();
        const published = entry.locator('.standing-you .standing-label > b');
        check(await published.textContent() === longName, 'Synthetic publish displays the full long nickname');
        check(await published.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Published nickname wraps without clipping');
        await fits(page, `Published name ${viewport.width}x${viewport.height}`);
        await entry.getByRole('button', {name: 'Remove', exact: true}).click();
        check(await entry.locator('.name-remove-confirm').isVisible(), 'Removal asks for confirmation');
        await entry.getByRole('button', {name: 'Keep it', exact: true}).click();
        check(posts === 2, 'Synthetic publish is intercepted; opening/cancelling removal sends no mutation');
        await page.screenshot({path: `${out}/published-name-${viewport.width}x${viewport.height}.png`, fullPage: true});
      }
      results.push({game: scenario.slug, viewport, interceptedActions: posts, nextDailyImmediatelyAfterScore: true});
      console.log(`${scenario.slug} ${viewport.width}x${viewport.height}: result and name panel fit`);
      await context.close();
    }
  }

  // The last daily of the day: the day-complete card owns the only share (the page is rewritten locally so the device appears to have finished the rest).
  for (const viewport of [{width: 360, height: 740}, {width: 390, height: 844}, {width: 1440, height: 900}]) {
    const scenario = scenarios[0];
    const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let posts = 0, others = [];
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.method() !== 'POST') {
        if (request.resourceType() !== 'document' || !new URL(request.url()).pathname.endsWith('/play')) return route.continue();
        const response = await route.fetch();
        let body = await response.text();
        const list = body.match(/\\"dailies\\":\[(.*?)\]/)?.[1] ?? '';
        const dailies = [...list.matchAll(/\\"slug\\":\\"([a-z-]+)\\"/g)].map(match => match[1]);
        others = [...new Set(dailies)].filter(slug => slug !== scenario.slug);
        body = body.replace(/\\"shotToday\\":\[\]/g, `\\"shotToday\\":[${others.map(slug => `\\"${slug}\\"`).join(',')}]`);
        return route.fulfill({response, body});
      }
      if (!request.headers()['next-action']) return route.fulfill({status: 204});
      posts++;
      if (posts > 1) return route.abort('blockedbyclient');
      return respond(route, {success: true, view: scenario.view, revision: 50, sessionToken: 'qa-layout-fixture', run: runFor(scenario, 900000100), publishedName: null});
    });
    await page.goto(`${base}/games/${scenario.slug}/play?mode=daily`, {waitUntil: 'networkidle'});
    await page.locator(scenario.control).first().click();
    const done = page.locator('.day-done');
    await done.waitFor();
    const total = others.length + 1;
    const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    check(await done.getByRole('heading', {name: 'Day complete', exact: true}).isVisible(), 'Day complete is a heading inside its own card');
    check((await done.locator('.day-done-sub').textContent()) === `All ${words[total]} done today`, `The sub line counts the ${total} dailies from the registry`);
    check(await done.locator('.day-strip li').count() === total, 'The score strip has one cell per daily');
    check(await page.locator('.a-card.compact').count() === 1, 'The result card turns compact beside the day-complete card');
    const visible = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter(node => node.checkVisibility()).map(node => ({text: node.textContent.trim(), primary: node.matches('.btn-primary, .next-card') && !node.matches('.standing-join')})));
    check(visible.filter(node => /^share/i.test(node.text)).map(node => node.text).join() === 'Share your day', 'Share your day is the only share');
    check(visible.filter(node => node.primary).length === 1 && visible.find(node => node.primary)?.text === 'Share your day', 'Share your day is the only primary');
    check(await done.getByRole('link', {name: 'Back to today', exact: true}).evaluate(node => getComputedStyle(node).color !== 'rgb(184, 67, 42)'), 'Back to today is a quiet ink link, not ember');
    await fits(page, `Day complete ${viewport.width}x${viewport.height}`);
    check(posts === 1 && errors.length === 0, `Day complete: one intercepted action, no client errors ${errors.join('; ')}`);
    await page.screenshot({path: `${out}/day-complete-${viewport.width}x${viewport.height}.png`, fullPage: true});
    results.push({game: 'day-complete', viewport, interceptedActions: posts, dailies: total});
    console.log(`day complete ${viewport.width}x${viewport.height}: one share, ${total} dailies`);
    await context.close();
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    let mutations = 0;
    await page.route('**/*', async route => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action']) { mutations++; return route.abort('blockedbyclient'); }
      if (route.request().method() === 'POST') return route.fulfill({status: 204});
      return route.continue();
    });
    await page.goto(`${base}/games/country-draft/leaderboard?date=2026-10-15`, {waitUntil: 'networkidle'});
    const rows = page.getByRole('list', {name: 'Published player scores', exact: true}).locator('.lb-row');
    check(await rows.count() > 0, 'Read-only historical board has public rows to exercise');
    await rows.locator('.lb-player-name b').evaluateAll((nodes, name) => nodes.forEach(node => { node.textContent = name; }), longName);
    await fits(page, `Leaderboard ${viewport.width}x${viewport.height}`);
    const report = rows.first().getByRole('button', {name: /^Report or block /});
    const touch = await report.boundingBox();
    check(touch.width >= 44 && touch.height >= 44, 'Player options retain44px target');
    await report.click();
    const form = rows.first().locator('.lb-report-form');
    await form.waitFor();
    await form.locator('.lb-report-name b').evaluate((node, name) => { node.textContent = name; }, longName);
    await fits(page, `Open report form ${viewport.width}x${viewport.height}`);
    const rowBox = await rows.first().boundingBox(), formBox = await form.boundingBox();
    check(formBox.x >= rowBox.x && formBox.x + formBox.width <= rowBox.x + rowBox.width + 1, 'Report form stays inside its player row');
    check(await form.getByRole('combobox').isEnabled(), 'Report reason is keyboard accessible');
    check(await form.getByRole('button', {name: 'Block player', exact: true}).isVisible(), 'Block control is available without an overflow menu');
    await page.screenshot({path: `${out}/leaderboard-open-${viewport.width}x${viewport.height}.png`, fullPage: true});
    await form.getByRole('button', {name: 'Cancel', exact: true}).click();
    check(await form.count() === 0, 'Cancel restores the player row');
    check(mutations === 0, 'No report or block request was submitted');
    results.push({game: 'leaderboard', viewport, mutations: 0, longNameStressFixture: true});
    console.log(`leaderboard ${viewport.width}x${viewport.height}: long names and open report form fit; no submissions`);
    await context.close();
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({checks, day, fixtureNotice: 'Terminal views generated from pure engines; synthetic QA run IDs. Public historical board names are changed locally only for width stress. No database writes.', results}, null, 2) + '\n');
  console.log(`${checks} result/leaderboard layout checks passed; no reports, blocks or real runs written.`);
} finally { await browser.close(); }
