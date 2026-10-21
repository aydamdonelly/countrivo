import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

// Isolated projections and browser-name storage. No database requests or writes.
const require = createRequire(import.meta.url), load = Module._load;
Module._load = function (name, parent, main) { return name === 'server-only' ? {} : load.call(this, name, parent, main); };
function stub(name, exports) { const id = require.resolve(name); require.cache[id] = { id, filename: id, loaded: true, exports }; }
let board, unavailable = false, countError = false, publicReads = 0;
const countQueries = [];
const boardQueries = [];
let editionUnavailable = false;
let allEntries = [];
let blockedCookie = false, blockError = false, missingRpc = false, legacyReads = 0;
const gates = { board: null, count: null, edition: null, block: null, challenge: null, device: null };
const blockQueries = [];
const pause = () => new Promise(resolve => setImmediate(resolve));
function gate() { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; }
stub('next/cache', { unstable_cache: callback => callback, updateTag: () => {} });
stub('next/headers', { cookies: async () => ({ get: key => key === 'cv_blocks' && blockedCookie ? { value: 'test-flag' } : undefined }) });
stub('../src/server/anonymous-identity.ts', { readDeviceId: async () => { if (gates.device) await gates.device.promise; return 'own-device'; }, verifyValue: () => 'enabled', gameDatabase: () => ({ from(table) {
  assert.equal(table, 'countrivo_leaderboard');
  const filters = {}; countQueries.push(filters);
  return { select(fields, options) { assert.equal(fields, 'id'); assert.deepEqual(options, { count: 'exact', head: true }); return this; },
    eq(key, value) { filters[key] = value; return this; }, neq(key, value) { assert.equal(key, 'id'); filters.excluded = value; return this; },
    gt(key, value) { assert.equal(key, 'score_sort_value'); filters.score = value; return this; },
    async abortSignal() { const count = countError ? null : allEntries.filter(entry => entry.id !== filters.excluded && entry.score_sort_value > filters.score).length;
      const error = countError ? { message: 'offline' } : null; if (gates.count) await gates.count.promise; return { count, error }; },
  };
}, rpc(name, args) {
  assert.equal(name, 'countrivo_blocked_names'); blockQueries.push(args); const error = blockError ? { message: 'offline blocks' } : null;
  return { abortSignal() { return this; }, async returns() { if (gates.block) await gates.block.promise; return { data: [{ run_id: 1 }], error }; } };
} }) });
stub('@supabase/supabase-js', { createClient: () => ({ rpc(name, args) {
  boardQueries.push(args);
  assert.equal(name, 'countrivo_ranked_board'); publicReads++;
  const data = unavailable || missingRpc ? null : board, error = missingRpc ? { code: 'PGRST202' } : unavailable ? { code: 'offline' } : null;
  return { abortSignal() { return this; }, async returns() { if (gates.board) await gates.board.promise; return { data, error }; } };
}, from(table) {
  assert.equal(table, 'countrivo_leaderboard'); legacyReads++; const snapshot = board;
  return { select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; }, abortSignal() { return this; },
    async returns() { return { data: snapshot.entries, count: snapshot.count, error: null }; } };
} }) });
stub('../src/server/challenges.ts', { challengeUrlForRun: async () => { if (gates.challenge) await gates.challenge.promise; return undefined; } });
stub('../src/server/edition.ts', { getEdition: async () => { if (gates.edition) await gates.edition.promise; if (editionUnavailable) throw new Error('offline edition'); return 'test-edition'; } });
stub('../src/server/board-snapshots.ts', { getArchivedBoard: async () => null });
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'isolated-test';
const { getTodayDateKey } = require('../src/lib/daily-seed.ts');
const { mapAnonymousRun } = require('../src/server/anonymous-runs.ts');
const row = { id: 9999, device_id: 'own-device', game_slug: 'country-draft', mode: 'daily', date_key: getTodayDateKey(), edition: 'test-edition', status: 'complete', score_raw: 100, score_max: 195, score_sort_value: 100, score_display: '100 / 195', result_json: {}, display_name: null, completed_at: new Date().toISOString(), started_at: new Date().toISOString(), moderation_hidden: false, archived: false };
function entry(id, score) { return { id, score_raw: score, score_max: 195, score_sort_value: score, score_display: String(score), display_name: `Player ${id}`, rank_daily: 1, percentile: 0, completed_at: row.completed_at, place_country_code: null }; }
function setBoard(entries, count = entries.length) { board = { entries, count, average: 0, countries: [] }; allEntries = entries; }
setBoard([]);
assert.deepEqual((await mapAnonymousRun(row)).rankPreview, { rank: 1, playerCount: 1 }, 'empty real board previews the first opt-in result');
setBoard([entry(1, 120), entry(2, 120), entry(3, 90)]);
assert.deepEqual((await mapAnonymousRun(row)).rankPreview, { rank: 3, playerCount: 4 }, 'rank counts strictly better named results');
assert.deepEqual((await mapAnonymousRun({ ...row, score_sort_value: 120 })).rankPreview, { rank: 1, playerCount: 4 }, 'ties share the same first place');
assert.deepEqual((await mapAnonymousRun({ ...row, score_sort_value: 80 })).rankPreview, { rank: 4, playerCount: 4 });
assert.equal(countQueries.length, 0, 'a complete board adds no per-result count roundtrip');
setBoard([entry(row.id, 100), entry(1, 120)]);
assert.deepEqual((await mapAnonymousRun(row)).rankPreview, { rank: 2, playerCount: 2 }, 'a previously published own row is never counted twice');
assert.equal((await mapAnonymousRun({ ...row, display_name: 'Published' })).rankPreview, undefined);
assert.equal((await mapAnonymousRun({ ...row, moderation_hidden: true })).rankPreview, undefined, 'moderation-hidden names never tease a public place');
assert.equal((await mapAnonymousRun({ ...row, archived: true })).rankPreview, undefined);
assert.equal((await mapAnonymousRun({ ...row, status: 'open' })).rankPreview, undefined);
unavailable = true; assert.equal((await mapAnonymousRun(row)).rankPreview, undefined, 'unavailable board is not an invented empty board'); unavailable = false;
const all = Array.from({ length: 1000 }, (_, i) => entry(i + 1, 1000 - i));
setBoard(all.slice(0, 500), 1000); allEntries = all;
assert.deepEqual((await mapAnonymousRun({ ...row, score_sort_value: 100 })).rankPreview, { rank: 901, playerCount: 1001 }, 'scores below the first 500 use an exact real-row count');
assert.deepEqual(countQueries[0], { game_slug: row.game_slug, date_key: row.date_key, edition: row.edition, excluded: row.id, score: 100 });
const before = countQueries.length;
assert.deepEqual((await mapAnonymousRun({ ...row, score_sort_value: 800 })).rankPreview, { rank: 201, playerCount: 1001 });
assert.equal(countQueries.length, before, 'a higher score has all better rows already visible');
countError = true; assert.equal((await mapAnonymousRun(row)).rankPreview, undefined, 'failed exact count never guesses a rank'); countError = false;
allEntries = Array.from({ length: 1005 }, (_, i) => entry(i + 1, 2000));
assert.equal((await mapAnonymousRun(row)).rankPreview, undefined, 'a fresh count cannot produce an impossible rank beyond the cached total');
setBoard([entry(1, 120), entry(2, 90)]);
const archivedPractice = await mapAnonymousRun({ ...row, mode: 'practice', date_key: '2020-01-01', edition: 'old-edition' });
assert.equal(archivedPractice.rankPreview, undefined, 'practice never receives a hypothetical daily rank');
assert.equal(archivedPractice.leaderboard.dateKey, getTodayDateKey(), 'archive practice shows the current daily board');
assert.equal(boardQueries.at(-1).p_day, getTodayDateKey());
assert.equal(boardQueries.at(-1).p_edition, 'test-edition');
assert.equal(archivedPractice.leaderboard.entries.length, 2);
editionUnavailable = true;
const savedWithoutBoard = await mapAnonymousRun({ ...row, mode: 'practice' });
assert.equal(savedWithoutBoard.scoreRaw, row.score_raw, 'optional ranking failure cannot discard a saved practice score');
assert.equal(savedWithoutBoard.leaderboard.available, false);
editionUnavailable = false;
const beforeLean = publicReads;
assert.equal((await mapAnonymousRun(row, { includeLeaderboard: false, includeChallenge: false })).rankPreview, undefined);
assert.equal(publicReads, beforeLean, 'lean projections still skip ranking reads');

// Held optional reads share one real900ms budget; none may start a second query afterwards.
const deadlineResults = [];
async function bounded(label, input = row, options = {}) {
  const started = performance.now();
  const result = await mapAnonymousRun(input, options);
  const elapsed = performance.now() - started;
  assert.ok(elapsed >= 850 && elapsed < 1700, `${label} uses one900ms budget, got ${elapsed}ms`);
  assert.equal(result.scoreRaw, input.score_raw, `${label} preserves a committed score`);
  assert.equal(result.resultJson, input.result_json, `${label} preserves the saved result`);
  assert.equal(result.rankDaily, null); assert.equal(result.rankPreview, undefined);
  if (options.includeLeaderboard !== false) { assert.equal(result.leaderboard.available, false); assert.deepEqual(result.leaderboard.entries, []); }
  deadlineResults.push({ label, elapsedMs: Math.round(elapsed) });
}

setBoard(all.slice(0, 500), 1000); allEntries = all;
gates.board = gate();
const countsBeforeTimeout = countQueries.length;
await bounded('held public board'); gates.board.release(); await pause(); gates.board = null;
assert.equal(countQueries.length, countsBeforeTimeout, 'late board completion cannot start an exact rank query');

setBoard([entry(1, 120)]);
gates.board = gate();
const beforeOwn = publicReads;
await bounded('held published own-board lookup', { ...row, display_name: 'Owner' });
gates.board.release(); await pause(); gates.board = null;
assert.equal(publicReads, beforeOwn + 1, 'late public board cannot start another own-row request');

missingRpc = true; gates.board = gate(); const beforeLegacy = legacyReads;
await bounded('held missing RPC'); gates.board.release(); await pause(); gates.board = null; missingRpc = false;
assert.equal(legacyReads, beforeLegacy, 'expired context never starts a legacy fallback query');

gates.edition = gate(); const beforeEditionBoard = publicReads, beforeEditionBlocks = blockQueries.length;
await bounded('held practice edition', { ...row, mode: 'practice' });
gates.edition.release(); await pause(); gates.edition = null;
assert.equal(publicReads, beforeEditionBoard, 'expired edition lookup cannot start a board read');
assert.equal(blockQueries.length, beforeEditionBlocks, 'expired edition lookup cannot start a block read');

setBoard(all.slice(0, 500), 1000); allEntries = all; gates.count = gate();
await bounded('held exact lower rank'); gates.count.release(); await pause(); gates.count = null;

setBoard([entry(1, 120), entry(2, 90)]); blockedCookie = true; gates.block = gate();
await bounded('held private block filter'); gates.block.release(); await pause(); gates.block = null;
blockError = true; const failClosed = await mapAnonymousRun(row); blockError = false;
assert.equal(failClosed.leaderboard.available, false); assert.deepEqual(failClosed.leaderboard.entries, []);
const filtered = await mapAnonymousRun(row); assert.deepEqual(filtered.leaderboard.entries.map(entry => entry.runId), [2]);

gates.device = gate(); const beforeDeviceBlocks = blockQueries.length;
await bounded('held private device lookup'); gates.device.release(); await pause(); gates.device = null;
assert.equal(blockQueries.length, beforeDeviceBlocks, 'expired device lookup cannot start a block RPC');

gates.edition = gate(); gates.board = gate();
const releaseEdition = setTimeout(() => gates.edition.release(), 450);
await bounded('edition and board use one total budget', { ...row, mode: 'practice' });
clearTimeout(releaseEdition); gates.board.release(); await pause(); gates.edition = gates.board = null;

gates.board = gate(); gates.block = gate();
const parallelStart = performance.now();
const parallel = mapAnonymousRun(row);
const releaseParallel = setTimeout(() => { gates.board.release(); gates.block.release(); }, 300);
const parallelResult = await parallel; clearTimeout(releaseParallel);
assert.ok(performance.now() - parallelStart < 700, 'independent board/block reads run in parallel');
assert.equal(parallelResult.leaderboard.available, true);
gates.board = gates.block = null; blockedCookie = false;

gates.challenge = gate(); await bounded('held optional challenge', row, { includeLeaderboard: false });
gates.challenge.release(); await pause(); gates.challenge = null;

// Full leaderboard reads still support the legacy schema-rollout path without a context deadline.
missingRpc = true; const beforeLegacySuccess = legacyReads;
const { anonymousBoard } = require('../src/server/anonymous-runs.ts');
assert.equal((await anonymousBoard(row.game_slug, row.date_key, { edition: row.edition })).available, true);
assert.equal(legacyReads, beforeLegacySuccess + 1); missingRpc = false;
console.log('Optional context deadline regressions:', JSON.stringify(deadlineResults));
mkdirSync('.check-render/result-context', { recursive: true });
writeFileSync('.check-render/result-context/report.json', JSON.stringify({
  checkedAt: new Date().toISOString(), method: 'Controlled held-read regression; no production latency claim or network/database writes',
  budgetMs: 900, results: deadlineResults, independentReadsParallel: true, noQueriesStartedAfterDeadline: true,
  scorePreserved: true, timedOutNamesAndRanksOmitted: true,
}, null, 2) + '\n');

const store = new Map(); globalThis.window = {}; globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
const { rememberedLeaderboardName, rememberLeaderboardName } = require('../src/lib/leaderboard-name.ts');
assert.equal(rememberedLeaderboardName(), ''); rememberLeaderboardName('  Last   Name '); assert.equal(rememberedLeaderboardName(), 'Last Name');
assert.equal(store.get('countrivo_leaderboard_name'), '"Last Name"', 'preference uses the prefix erased by Forget this device');
for (const value of [null, {}, ['Someone'], '<script>', 'x', 'x'.repeat(21)]) { store.set('countrivo_leaderboard_name', JSON.stringify(value)); assert.equal(rememberedLeaderboardName(), ''); }
Module._load = load;
console.log('Leaderboard preview regression passed: real counts, ties, own-row exclusion, moderation/privacy guards, >500 exact ranking, failures, lean reads and safe remembered names.');
