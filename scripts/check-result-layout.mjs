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
  return {id, gameSlug: scenario.slug, mode: 'daily', dailyDate: day, scoreRaw: scenario.raw, scoreMax: scenario.max, scoreDisplay: scenario.score, scoreSortValue: scenario.raw, scoreNormalized: 50, rankDaily: null, percentile: null, isPersonalBest: false, resultJson: {qaFixture: true}, completedAt: new Date().toISOString(), rankPreview: {rank: 3, playerCount: 7}};
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
        if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue();
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
      const scoreSelector = scenario.slug === 'country-draft' ? '.dr-final > .dr-result-card' : '.rp-wrap > .rp';
      check(await page.locator(scoreSelector).first().evaluate(node => !!node.nextElementSibling?.querySelector('.leaderboard-entry')), `${scenario.slug}: naming is immediately after the score card`);
      const preceding = await entry.evaluate(node => {
        const before = selector => Array.from(document.querySelectorAll(selector)).some(other => !!(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING));
        return {nextGame: before('.daily-next, .table-next-row'), bonus: before('.gw-bonus'), map: before('.dr-conquest-panel, .gw-map')};
      });
      check(!Object.values(preceding).some(Boolean), `${scenario.slug}: no next game, bonus or result map precedes naming`);
      const input = entry.getByRole('textbox', {name: 'Your name on the board', exact: true});
      await input.fill(longName);
      check(await input.inputValue() === longName, 'A20-character nickname remains editable');
      check(await input.getAttribute('maxlength') === '20', 'Nickname length matches the public limit');
      const submit = entry.getByRole('button', {name: 'Put me on the leaderboard', exact: true});
      check(await submit.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Publishing CTA remains fully readable');
      await fits(page, `${scenario.slug} ${viewport.width}x${viewport.height}`);
      check(posts === 1, 'Result fixture uses one intercepted action and sends no publish/report action');
      check(errors.length === 0, `${scenario.slug}: no client exceptions: ${errors.join('; ')}`);
      await page.screenshot({path: `${out}/${scenario.slug}-${viewport.width}x${viewport.height}.png`, fullPage: true});
      if (scenario.slug === 'higher-or-lower') {
        await submit.click();
        await entry.getByRole('link', {name: 'See your place', exact: true}).waitFor();
        const published = entry.locator('.name-standing .t-body');
        check(await published.textContent() === longName, 'Synthetic publish displays the full long nickname');
        check(await published.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Published nickname wraps without clipping');
        await fits(page, `Published name ${viewport.width}x${viewport.height}`);
        await entry.getByRole('button', {name: 'Remove my name', exact: true}).click();
        check(await entry.locator('.name-remove-confirm').isVisible(), 'Removal asks for confirmation');
        await entry.getByRole('button', {name: 'Keep it', exact: true}).click();
        check(posts === 2, 'Synthetic publish is intercepted; opening/cancelling removal sends no mutation');
        await page.screenshot({path: `${out}/published-name-${viewport.width}x${viewport.height}.png`, fullPage: true});
      }
      results.push({game: scenario.slug, viewport, interceptedActions: posts, nameImmediatelyAfterScore: true});
      console.log(`${scenario.slug} ${viewport.width}x${viewport.height}: result and name panel fit`);
      await context.close();
    }
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    let mutations = 0;
    await page.route('**/*', async route => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action']) { mutations++; return route.abort('blockedbyclient'); }
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
    await form.getByRole('button', {name: 'Close', exact: true}).click();
    check(await form.count() === 0, 'Close restores the player row');
    check(mutations === 0, 'No report or block request was submitted');
    results.push({game: 'leaderboard', viewport, mutations: 0, longNameStressFixture: true});
    console.log(`leaderboard ${viewport.width}x${viewport.height}: long names and open report form fit; no submissions`);
    await context.close();
  }
  writeFileSync(`${out}/report.json`, JSON.stringify({checks, day, fixtureNotice: 'Terminal views generated from pure engines; synthetic QA run IDs. Public historical board names are changed locally only for width stress. No database writes.', results}, null, 2) + '\n');
  console.log(`${checks} result/leaderboard layout checks passed; no reports, blocks or real runs written.`);
} finally { await browser.close(); }
