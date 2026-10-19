import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';

// Isolated projections and browser-name storage. No database requests or writes.
const require = createRequire(import.meta.url), load = Module._load;
Module._load = function (name, parent, main) { return name === 'server-only' ? {} : load.call(this, name, parent, main); };
function stub(name, exports) { const id = require.resolve(name); require.cache[id] = { id, filename: id, loaded: true, exports }; }
let board, unavailable = false, countError = false, publicReads = 0;
const countQueries = [];
let allEntries = [];
stub('next/cache', { unstable_cache: callback => callback, updateTag: () => {} });
stub('next/headers', { cookies: async () => ({ get: () => undefined }) });
stub('../src/server/anonymous-identity.ts', { readDeviceId: async () => 'own-device', verifyValue: () => null, gameDatabase: () => ({ from(table) {
  assert.equal(table, 'countrivo_leaderboard');
  const filters = {}; countQueries.push(filters);
  return { select(fields, options) { assert.equal(fields, 'id'); assert.deepEqual(options, { count: 'exact', head: true }); return this; },
    eq(key, value) { filters[key] = value; return this; }, neq(key, value) { assert.equal(key, 'id'); filters.excluded = value; return this; },
    gt(key, value) { assert.equal(key, 'score_sort_value'); filters.score = value; return this; },
    async abortSignal() { return { count: countError ? null : allEntries.filter(entry => entry.id !== filters.excluded && entry.score_sort_value > filters.score).length, error: countError ? { message: 'offline' } : null }; },
  };
} }) });
stub('@supabase/supabase-js', { createClient: () => ({ rpc(name) {
  assert.equal(name, 'countrivo_ranked_board'); publicReads++;
  return { abortSignal() { return this; }, async returns() { return { data: unavailable ? null : board, error: unavailable ? { code: 'offline' } : null }; } };
} }) });
stub('../src/server/challenges.ts', { challengeUrlForRun: async () => undefined });
stub('../src/server/edition.ts', { getEdition: async () => 'test-edition' });
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
const beforeLean = publicReads;
assert.equal((await mapAnonymousRun(row, { includeLeaderboard: false, includeChallenge: false })).rankPreview, undefined);
assert.equal(publicReads, beforeLean, 'lean projections still skip ranking reads');
const store = new Map(); globalThis.window = {}; globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
const { rememberedLeaderboardName, rememberLeaderboardName } = require('../src/lib/leaderboard-name.ts');
assert.equal(rememberedLeaderboardName(), ''); rememberLeaderboardName('  Last   Name '); assert.equal(rememberedLeaderboardName(), 'Last Name');
assert.equal(store.get('countrivo_leaderboard_name'), '"Last Name"', 'preference uses the prefix erased by Forget this device');
for (const value of [null, {}, ['Someone'], '<script>', 'x', 'x'.repeat(21)]) { store.set('countrivo_leaderboard_name', JSON.stringify(value)); assert.equal(rememberedLeaderboardName(), ''); }
Module._load = load;
console.log('Leaderboard preview regression passed: real counts, ties, own-row exclusion, moderation/privacy guards, >500 exact ranking, failures, lean reads and safe remembered names.');
