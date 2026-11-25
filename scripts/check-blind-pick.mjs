import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';

// node --import tsx scripts/check-blind-pick.mjs; all state stays in memory.
const require = createRequire(import.meta.url);
const load = Module._load;
Module._load = function (name, parent, main) {
  return name === 'server-only' ? {} : load.call(this, name, parent, main);
};
process.env.COUNTRIVO_GAME_SECRET = 'blind-pick-check-not-a-production-secret';
const { mulberry32 } = require('../src/lib/seeded-random.ts');
const { dateSeed } = require('../src/lib/daily-seed.ts');
const { generateBlindPickConfig, greedyScore } = require('../src/lib/game-logic/blind-pick/generator.ts');
const { createGame, place, undo, canUndo } = require('../src/lib/game-logic/blind-pick/engine.ts');
const { closestPerfect, computeResult, swapCycles } = require('../src/lib/game-logic/blind-pick/scoring.ts');
const { sovereignRank } = require('../src/lib/game-logic/blind-pick/sovereign-ranks.ts');
const { worldRankQuality } = require('../src/lib/game-logic/blind-pick/display.ts');
const { gameModule, legacyGameModule, v3GameModule, blindPickModuleFor, BLIND_PICK_VERSION } = require('../src/games/blind-pick/module.ts');
const { ANCHOR_STATS, BLIND_PICK_ROTATION_FROM, V3_STATS, rotatingStatsForDate } = require('../src/lib/game-logic/blind-pick/rotation.ts');
const { codec } = require('../src/games/blind-pick/codec.ts');
const { replay } = require('../src/features/play/replay.ts');
const { blindPickShapeError, validateBlindPickResult } = require('../src/lib/game-logic/blind-pick/server-validate.ts');
const { blindView, blindSessionModule } = require('../src/server/blind-session.ts');
const { encodeRunTicket } = require('../src/server/anonymous-identity.ts');
let checks = 0;
function check(ok, label) { assert(ok, label); checks += 1; }
function equal(actual, expected, label) { assert.deepEqual(actual, expected, label); checks += 1; }
const day = '2026-10-28';
const ctx = { mode: 'daily', dateKey: day, startedAt: '2026-10-28T09:00:00.000Z' };

// Quality describes each revealed world rank, independently of the board optimum.
for (const [rank, of, label] of [[1,194,'Great rank'],[19,194,'Great rank'],[20,194,'Strong rank'],[48,194,'Strong rank'],[49,194,'Mid rank'],[97,194,'Mid rank'],[98,194,'Weak rank'],[151,194,'Weak rank'],[194,194,'Weak rank'],[20,195,'Strong rank'],[0,194,''],[195,194,''],[1,0,''],[NaN,194,'']]) {
  equal(worldRankQuality(rank,of),label,`World rank ${rank}/${of} has an honest quality label`);
}

// Germany, Egypt and Japan: toy ranks deliberately expose the mutually exclusive choice.
// Columns: area, life expectancy, population. A greedy first choice is not globally best.
const example = [[4, 9, 5], [2, 8, 7], [7, 1, 2]];
const optimum = closestPerfect(example, []);
equal(optimum, { sum: 8, perfect: [2, 0, 1] }, 'Best combination: Germany population, Egypt area, Japan life expectancy');
check(greedyScore(example) > optimum.sum, 'Independent best-free choices can miss the globally best board');
equal(closestPerfect([[1, 1], [1, 1]], [1, 0]), { sum: 2, perfect: [1, 0] }, 'Equivalent optimal boards retain the player’s choices');
equal(closestPerfect(Array.from({length:8}, (_,i) => Array.from({length:8}, (_,j) => i === j ? 3 : 100)), []), {sum:24, perfect:[0,1,2,3,4,5,6,7]}, 'Eight-country exact optimum');

// Frozen examples captured from the six-country generator before the rules update.
const legacyFixtures = [
  {seed:1,countries:['LUX','SLE','AFG','VNM','ESP','MEX'],stats:['fertility-rate','gdp-per-capita','internet-users-pct','area-km2','life-expectancy','forest-coverage-pct'],optimal:206,assignment:[2,0,3,5,4,1],greedy:229},
  {seed:7,countries:['ESP','MRT','ZAF','VCT','GTM','TKM'],stats:['urban-population-pct','fertility-rate','gdp','area-km2','gdp-per-capita','life-expectancy'],optimal:306,assignment:[5,1,2,4,0,3],greedy:322},
  {seed:23,countries:['CHN','AGO','GRD','MUS','MHL','HND'],stats:['gdp','gdp-per-capita','internet-users-pct','fertility-rate','urban-population-pct','area-km2'],optimal:323,assignment:[0,5,1,2,4,3],greedy:332},
];
for (const fixture of legacyFixtures) {
  const config=generateBlindPickConfig(mulberry32(fixture.seed),'daily',day,6);
  equal({seed:fixture.seed,countries:config.countries.map(c=>c.iso3),stats:config.categories.map(c=>c.slug),optimal:config.optimalScore,assignment:config.optimalAssignment,greedy:config.greedyScore},fixture,'Historical seeds retain the exact same six-country board');
}
// Frozen eight-country examples captured from the nine-statistic generator on 2026-11-25, before the rotation.
const v3Fixtures = [
  {seed:1,countries:['LBR','HUN','NZL','DOM','TTO','POL','PNG','MDG'],stats:['fertility-rate','gdp-per-capita','internet-users-pct','area-km2','life-expectancy','forest-coverage-pct','gdp','population'],optimal:300,assignment:[0,2,4,6,1,7,5,3],greedy:309},
  {seed:7,countries:['ARM','IRN','NGA','STP','VNM','MEX','KNA','BOL'],stats:['urban-population-pct','fertility-rate','gdp','area-km2','gdp-per-capita','life-expectancy','internet-users-pct','forest-coverage-pct'],optimal:361,assignment:[5,0,1,7,6,2,4,3],greedy:381},
  {seed:23,countries:['CHN','AGO','GRD','MUS','MHL','HND','HUN','MDV'],stats:['gdp','gdp-per-capita','internet-users-pct','fertility-rate','urban-population-pct','area-km2','life-expectancy','forest-coverage-pct'],optimal:349,assignment:[0,5,7,1,4,3,2,6],greedy:358},
  {seed:71,countries:['CIV','AUT','OMN','TCD','RUS','TZA','ZAF','AUS'],stats:['urban-population-pct','fertility-rate','gdp','population','gdp-per-capita','forest-coverage-pct','life-expectancy','area-km2'],optimal:193,assignment:[1,4,0,7,2,5,3,6],greedy:216},
];
const shape = (seed, config) => ({seed,countries:config.countries.map(c=>c.iso3),stats:config.categories.map(c=>c.slug),optimal:config.optimalScore,assignment:config.optimalAssignment,greedy:config.greedyScore});
const rotationDay = BLIND_PICK_ROTATION_FROM;
const lastV3Day = '2026-11-26';
for (const fixture of v3Fixtures) {
  equal(shape(fixture.seed, generateBlindPickConfig(mulberry32(fixture.seed),'daily','2026-11-25')), fixture, 'Today keeps the exact nine-statistic eight-country board');
  equal(shape(fixture.seed, generateBlindPickConfig(mulberry32(fixture.seed),'daily',lastV3Day)), fixture, 'The day before the rotation keeps the nine-statistic board');
  equal(shape(fixture.seed, generateBlindPickConfig(mulberry32(fixture.seed),'practice',rotationDay,8,'v3')), fixture, 'The V3 pool ignores the rotation date');
  equal(shape(fixture.seed, v3GameModule.create(fixture.seed,'practice',rotationDay).g.config), fixture, 'A version 3 session keeps its board after the rotation starts');
}
for (let seed = 1; seed <= 20; seed += 1) {
  for (const date of ['2026-11-25', lastV3Day]) {
    equal(generateBlindPickConfig(mulberry32(seed),'daily',date), generateBlindPickConfig(mulberry32(seed),'daily',date,8,'v3'), 'Boards dated before the rotation are deep-equal to V3');
    equal(gameModule.create(seed,'practice',date), v3GameModule.create(seed,'practice',date), 'Practice dated before the rotation keeps the V3 draw');
  }
}
for (let seed = 1; seed <= 20; seed += 1) {
  const config = generateBlindPickConfig(mulberry32(seed),'daily',rotationDay);
  const slugs = config.categories.map(c=>c.slug).sort();
  equal(slugs, [...ANCHOR_STATS, ...rotatingStatsForDate(rotationDay)].sort(), 'Rotation dailies take the four anchors and the date’s four rotating statistics');
  check(config.version === 3 && config.countries.length === 8, 'Rotation keeps the eight-country rules version');
  const practice = gameModule.create(seed,'practice',rotationDay).g.config.categories.map(c=>c.slug);
  check(ANCHOR_STATS.every(a=>practice.includes(a)) && new Set(practice).size === 8, 'Rotation practice keeps the anchors and eight distinct statistics');
}
check(rotatingStatsForDate(lastV3Day) === null && rotatingStatsForDate(rotationDay).length === 4, 'Rotation switches on at its first Berlin day');
const observedStats = new Set();
for (let seed = 1; seed <= 40; seed += 1) {
  const config = generateBlindPickConfig(mulberry32(seed), 'daily', day);
  check(config.countries.length === 8 && config.categories.length === 8 && config.version === 3, 'Eight countries and eight slots');
  check(new Set(config.countries.map(c => c.iso3)).size === 8 && new Set(config.categories.map(c => c.slug)).size === 8, 'Unique countries and categories');
  check(config.countries.every(c => config.categories.every(s => sovereignRank(c.iso3, s.slug) !== null)), 'Every drawn country has all eight statistics');
  equal(config, generateBlindPickConfig(mulberry32(seed), 'daily', day), 'Same seed deals same board');
  const optimalState = {config, placements:config.optimalAssignment};
  const result = computeResult(optimalState);
  check(result.over === 0 && result.swaps.length === 0, 'Optimal assignment is Perfect');
  for (const category of config.categories) observedStats.add(category.slug);
}
check(observedStats.has('population') && observedStats.has('area-km2') && observedStats.has('life-expectancy') && observedStats.size > 8, 'Daily choices include requested statistics and vary');
let game = createGame(mulberry32(7), 'practice', day);
check(!canUndo(game) && undo(game) === game, 'Cannot undo an empty board');
const empty = game;
game = place(game, 2);
check(empty.placements.length === 0 && game.placements.length === 1, 'Placement is immutable');
check(place(game, 2) === game && place(game, 8) === game && place(game, 0.5) === game, 'Duplicate and out-of-range slots rejected');
const revealedCountry = game.config.countries[0];
game = undo(game);
check(game.undoUsed && game.placements.length === 0 && game.config.countries[0] === revealedCountry, 'Undo returns same country without a redraw');
const oneUndoSpent = place(game, 3);
check(!canUndo(oneUndoSpent) && undo(oneUndoSpent) === oneUndoSpent, 'A second undo is rejected after replacement');

let state = gameModule.create(23, 'practice', day);
const log = [];
for (let slot = 0; slot < 8; slot += 1) { const action = {t:'place',s:slot}; log.push(action); state = gameModule.reduce(state, action); }
check(!gameModule.done(state) && canUndo(state.g), 'Last placement still allows the one undo before reveal');
state = gameModule.reduce(state, {t:'undo'}); log.push({t:'undo'});
check(state.g.placements.length === 7 && state.g.undoUsed, 'Last-country undo is persisted');
state = gameModule.reduce(state, {t:'place',s:7}); log.push({t:'place',s:7});
const concealed = blindView(state);
check(concealed.g.config.optimalScore === 0 && concealed.g.config.optimalAssignment.length === 0, 'Completed board conceals optimum until reveal');
check(concealed.g.config.costMatrix.every((row,i) => row.every((value,j) => j === state.g.placements[i] || value === 0)), 'Unchosen ranks stay concealed before reveal');
state = gameModule.reduce(state, {t:'seen'}); log.push({t:'seen'});
check(gameModule.done(state) && gameModule.reduce(state,{t:'undo'}) === state, 'Final reveal closes undo permanently');
equal(replay(gameModule,23,'practice',day,codec.enc(log)).state, state, 'Append-only placement/undo/reveal replay matches exactly');
equal(codec.dec(codec.enc(log)), log, 'Eight-board codec roundtrip');
check(codec.enc(log).startsWith('b8.') && codec.enc(log).includes('u'), 'New codec version retains undo');
assert.throws(() => codec.dec('b6.6')); checks += 1;
assert.throws(() => codec.dec('b8.8')); checks += 1;
assert.throws(() => codec.dec('b6.u')); checks += 1;
assert.throws(() => codec.enc([{t:'place',s:-1}])); checks += 1;
const first = gameModule.reduce(gameModule.create(23,'practice',day),{t:'place',s:0});
const view = blindView(first);
check(view.g.config.countries.slice(2).every(c=>!c.iso3) && view.g.config.countries[1].iso3 !== '', 'Only placed and current country names are public');
check(view.g.config.costMatrix.slice(1).flat().every(rank=>rank===0), 'Current and future ranks are never sent');
check(!JSON.stringify(view).includes('"seed"'), 'Public board contains no reconstructable seed');
const undoView = blindView(gameModule.reduce(first,{t:'undo'}));
check(undoView.g.config.costMatrix.flat().every(rank=>rank===0), 'Undo does not preserve hidden rank cells');

const legacyPlayed = replay(legacyGameModule, 23, 'practice', day, 'b6.012345s');
check(legacyGameModule.done(legacyPlayed.state) && legacyPlayed.state.g.config.countries.length === 6, 'Historical six-slot log completes with historical rules');
check(!canUndo(legacyPlayed.state.g), 'Legacy board does not gain new undo rules');
const legacyPayload = legacyGameModule.payload(legacyPlayed.state, ctx);
check(legacyPayload.resultJson.v === 2 && legacyPayload.scoreMax === 1170, 'Historical score format is retained');
check(blindPickShapeError(legacyPayload.scoreRaw,legacyPayload.scoreMax,legacyPayload.resultJson) === null, 'Historical result shape still validates');
const frozen = {...legacyGameModule, create:() => legacyGameModule.create(23,'daily',day)};
equal(replay(frozen,999,'daily',day,'b6.012345s').state, replay(legacyGameModule,23,'daily',day,'b6.012345s').state, 'Frozen board ignores new seed while preserving legacy placements');
const historical = legacyGameModule.create(23,'daily',day);
delete historical.g.undoUsed;
delete historical.g.config.version;
const frozenUnderCurrent = {...gameModule, create:() => historical};
const historicalFinished = replay(frozenUnderCurrent,999,'daily',day,'b6.012345s').state;
check(gameModule.done(historicalFinished) && historicalFinished.g.placements.length === 6, 'Current adapter completes old frozen snapshots without new optional fields');
check(gameModule.payload(historicalFinished,ctx).resultJson.v === 2, 'Old frozen snapshot keeps its original result version');
const resumedLegacy = replay(legacyGameModule,23,'practice',day,'b6.012');
const appendedLegacy = [...resumedLegacy.actions,{t:'place',s:3}];
check(codec.enc(appendedLegacy).startsWith('b8.') && replay(legacyGameModule,23,'practice',day,codec.enc(appendedLegacy)).state.g.config.countries.length === 6, 'Re-encoded legacy logs keep the signed session’s six-country rules');
const ticket = {id:'test',slug:'blind-pick',mode:'practice',dateKey:day,edition:'test',seed:23,startedAt:ctx.startedAt};
check(blindSessionModule(encodeRunTicket(ticket)).create(23,'practice',day).g.config.countries.length === 6, 'Old signed practice token keeps six-country board');
check(blindSessionModule(encodeRunTicket({...ticket,contentVersion:3})).create(23,'practice',day).g.config.countries.length === 8, 'New signed practice token selects eight-country board');
check(blindSessionModule().create(23,'practice',day).g.config.countries.length === 8, 'Fresh practice selects eight-country board');
const v3Ticket = {...ticket,dateKey:rotationDay,contentVersion:3};
equal(blindSessionModule(encodeRunTicket(v3Ticket)).create(23,'practice',rotationDay).g, v3GameModule.create(23,'practice',rotationDay).g, 'A version 3 practice token resumes on its nine-statistic board');
check(blindSessionModule(encodeRunTicket(v3Ticket)).create(23,'practice',rotationDay).g.config.categories.every(c=>V3_STATS.includes(c.slug)), 'Version 3 boards never draw a rotation statistic');
const v4Board = blindSessionModule(encodeRunTicket({...v3Ticket,contentVersion:BLIND_PICK_VERSION})).create(23,'practice',rotationDay).g;
equal(v4Board, gameModule.create(23,'practice',rotationDay).g, 'A version 4 practice token gets the rotation board');
check(ANCHOR_STATS.every(a=>v4Board.config.categories.some(c=>c.slug===a)), 'The rotation board carries the anchors');
check(blindPickModuleFor(undefined) === legacyGameModule && blindPickModuleFor(3) === v3GameModule && blindPickModuleFor(BLIND_PICK_VERSION) === gameModule && blindPickModuleFor(99) === legacyGameModule, 'Replay and snapshots map every content version to its board');

for (const [adapter, date] of [[legacyGameModule, day], [gameModule, day], [v3GameModule, day], [gameModule, rotationDay]]) {
  const seed = dateSeed(date + 'test');
  let played = adapter.create(seed,'daily',date);
  for (let slot=0;slot<played.g.config.countries.length;slot+=1) played=adapter.reduce(played,{t:'place',s:slot});
  played=adapter.reduce(played,{t:'seen'});
  const payload=adapter.payload(played,{...ctx,dateKey:date});
  check(validateBlindPickResult(date,payload.scoreRaw,payload.resultJson,'test').valid,'Current and historical daily replay validate');
  check(!validateBlindPickResult(date,payload.scoreRaw+1,payload.resultJson,'test').valid,'Forged score rejected');
  check(blindPickShapeError(payload.scoreRaw,payload.scoreMax,{...payload.resultJson,placements:Array(played.g.config.countries.length).fill(0)}) !== null,'Duplicate placements rejected');
  check(blindPickShapeError(payload.scoreRaw,payload.scoreMax,{...payload.resultJson,v:99}) !== null,'Unknown rules version rejected');
  const result=computeResult(played.g);
  const swaps=swapCycles(result.placements,result.perfect,result.ranks,result.perfectRanks);
  check(swaps.every(s=>s.saved>0) && swaps.reduce((sum,s)=>sum+s.saved,0)===result.over,'Swap explanation accounts for every lost rank');
}
console.log(`Blind Pick: ${checks} checks passed; eight-country solver, one undo, hidden information, frozen V3 boards, the daily rotation and historical six-country compatibility.`);
