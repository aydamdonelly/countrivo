import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

// Run with node --import tsx scripts/check-session-fastpath.mjs. Persistence is isolated in memory.
const require = createRequire(import.meta.url);
const load = Module._load;
Module._load = function (name, parent, main) {
  return name === 'server-only' ? {} : load.call(this, name, parent, main);
};
function stub(name, exports) {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
const cookieValues = new Map();
stub('next/headers', { cookies: async () => ({ get: name => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
  set: (name, value) => cookieValues.set(name, value) }) });
stub('next/server', { after: () => {} });
process.env.COUNTRIVO_GAME_SECRET = 'isolated-fast-path-check-secret-not-production';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.COUNTRIVO_SUPABASE_SERVICE_KEY = 'isolated-test';

const rows = new Map(), queries = [];
let nextId = 1, failWrite = false, loseReply = false;
let runProjectionStarted = false, runProjectionFinished = false;
class Query {
  constructor(table) { this.table = table; this.op = 'SELECT'; this.filters = []; }
  select() { return this; }
  eq(key, value) { this.filters.push([key, value]); return this; }
  insert(value) { this.op = 'INSERT'; this.value = value; return this; }
  update(value) { this.op = 'UPDATE'; this.value = value; return this; }
  async maybeSingle() {
    assert.equal(this.table, 'countrivo_runs');
    queries.push(this.op);
    const matches = row => this.filters.every(([key, value]) => row[key] === value);
    const saved = [...rows.values()].find(matches);
    if (this.op === 'SELECT') return { data: saved ?? null, error: null };
    if (failWrite) { failWrite = false; return { data: null, error: 'isolated failure' }; }
    if (this.op === 'INSERT') {
      const value = this.value;
      if (rows.has(value.session_id) || (value.mode === 'daily' && [...rows.values()].some(row => row.device_id === value.device_id
        && row.game_slug === value.game_slug && row.date_key === value.date_key && row.edition === value.edition && row.mode === 'daily')))
        return { data: null, error: 'duplicate' };
      const inserted = { id: nextId++, status: 'open', action_log: '', revision: 0, display_name: null, state_json: null, ...value };
      rows.set(inserted.session_id, inserted);
      return { data: inserted, error: null };
    }
    if (!saved) return { data: null, error: null };
    const updated = { ...saved, ...this.value };
    rows.set(updated.session_id, updated);
    if (loseReply) { loseReply = false; return { data: null, error: 'isolated lost reply' }; }
    return { data: updated, error: null };
  }
  single() { return this.maybeSingle(); }
  lte() { return this; }
  order() { return this; }
  limit() { return this; }
  abortSignal() { return this; }
  async returns() {
    queries.push('SELECT_STREAK');
    assert(runProjectionStarted && !runProjectionFinished, 'streak read runs while the result projection is pending');
    return { data: [...rows.values()].filter(row => this.filters.every(([key, value]) => row[key] === value)), error: null };
  }
}
stub('@supabase/supabase-js', { createClient: () => ({ from: table => new Query(table) }) });
stub('../src/server/anonymous-runs.ts', { mapAnonymousRun: async row => {
  runProjectionStarted = true;
  await new Promise(resolve => setTimeout(resolve, 10));
  runProjectionFinished = true;
  return { id: row.id, scoreRaw: row.score_raw };
} });
stub('../src/server/edition.ts', { getEdition: async () => 'isolated-edition' });
stub('../src/server/daily-board-state.ts', { resolveDailyBoard: async (module, _view, input) => ({ seed: input.seed, state: module.create(input.seed, 'daily', input.dateKey) }) });
stub('../src/server/board-snapshots.ts', { archivedState: async () => null, frozenBoardState: async () => null });
stub('../src/server/leaderboard-bots.ts', { seedRivalsForGame: async () => {} });
const { encodeRunTicket, readRunTicket, signValue } = require('../src/server/anonymous-identity.ts');
const { commitGameSession } = require('../src/server/game-sessions.ts');
const { getTodayDateKey } = require('../src/lib/daily-seed.ts');
const { flagRemote, flagView, quickProject } = require('../src/server/quick-sessions.ts');
const deviceId = randomUUID();
cookieValues.set('cv_device', signValue(deviceId));
const dateKey = getTodayDateKey();
const ticket = { id: randomUUID(), slug: 'flag-quiz', mode: 'practice', dateKey, edition: 'isolated-edition', seed: 4321, startedAt: new Date().toISOString() };
const project = quickProject(flagView, 'practice', dateKey);
let passed = 0;
function check(ok, label) { assert(ok, label); passed++; }
async function move(token, revision, action, expectedQueries) {
  queries.length = 0;
  const result = await commitGameSession(flagRemote, project, { sessionToken: token, revision, action });
  if (expectedQueries) assert.deepEqual(queries, expectedQueries);
  return result;
}
const fresh = encodeRunTicket(ticket);
const parallelTicket = { ...ticket, id: randomUUID() };
const firstRace = await Promise.all([
  move(encodeRunTicket(parallelTicket), 0, { t: 'answer', i: 0 }),
  move(encodeRunTicket(parallelTicket), 0, { t: 'answer', i: 1 }),
]);
check(firstRace.every(result => result.revision === 1) && JSON.stringify(firstRace[0].view) === JSON.stringify(firstRace[1].view)
  && rows.get(parallelTicket.id).revision === 1, 'conflicting first moves insert and reveal exactly one canonical choice');
const first = await move(fresh, 0, { t: 'answer', i: 0 }, ['INSERT']);
check(first.success && first.revision === 1 && first.view.phase === 'reveal', 'first answer is stored in one atomic insert');
check(readRunTicket(first.sessionToken)?.cursor?.revision === 1, 'returned cursor reflects the stored revision');
check(readRunTicket(first.sessionToken)?.cursor?.deviceId === deviceId, 'cursor is bound to the signed device');
check(!first.sessionToken.includes(deviceId), 'cursor and identity remain encrypted');
const second = await move(first.sessionToken, 1, { t: 'next' }, ['UPDATE']);
check(second.success && second.revision === 2 && second.view.phase === 'playing', 'normal move uses one CAS update');
const stale = await move(first.sessionToken, 1, { t: 'next' }, ['UPDATE', 'SELECT']);
check(stale.success && stale.revision === 2 && JSON.stringify(stale.view) === JSON.stringify(second.view), 'stale replay returns the canonical saved state');
const wrongRevision = await move(first.sessionToken, 2, { t: 'answer', i: 0 }, ['SELECT', 'UPDATE']);
check(wrongRevision.success && wrongRevision.revision === 3, 'ticket revision mismatch falls back to the actual saved log');
const legacyTicket = readRunTicket(wrongRevision.sessionToken);
delete legacyTicket.cursor;
const legacy = await move(encodeRunTicket(legacyTicket), 3, { t: 'next' }, ['SELECT', 'UPDATE']);
check(legacy.success && legacy.revision === 4, 'already issued legacy tickets continue to work');
const invalid = await move(legacy.sessionToken, 4, { t: 'answer', i: 9 }, ['SELECT']);
check(!invalid.success && invalid.revision === 4 && invalid.view.correctIndex === null, 'invalid option never reveals or advances');
failWrite = true;
const failed = await move(legacy.sessionToken, 4, { t: 'answer', i: 0 }, ['UPDATE', 'SELECT']);
check(!failed.success && failed.revision === 4 && failed.view.correctIndex === null, 'failed database write never reveals an answer');
loseReply = true;
const recovered = await move(legacy.sessionToken, 4, { t: 'answer', i: 0 }, ['UPDATE', 'SELECT']);
check(recovered.success && recovered.revision === 5 && recovered.view.phase === 'reveal', 'lost successful update response recovers only the persisted reveal');
const concurrent = await Promise.all([
  move(recovered.sessionToken, 5, { t: 'next' }),
  move(recovered.sessionToken, 5, { t: 'next' }),
]);
check(concurrent.every(response => response.revision === 6) && rows.get(ticket.id).revision === 6, 'concurrent same revision advances exactly once');
cookieValues.set('cv_device', signValue(randomUUID()));
const stolen = await move(concurrent[0].sessionToken, 6, { t: 'answer', i: 0 }, ['SELECT', 'INSERT']);
check(!stolen.success && rows.get(ticket.id).revision === 6 && stolen.view.correctIndex === null, 'another device cannot reuse the cursor or reveal a move');
cookieValues.set('cv_device', signValue(deviceId));
const corrupt = concurrent[0].sessionToken.slice(0, -5) + 'AAAAA';
check(readRunTicket(corrupt) === null, 'tampered authenticated ticket is rejected');
queries.length = 0;
await assert.rejects(commitGameSession(flagRemote, project, { sessionToken: corrupt, revision: 6, action: { t: 'answer', i: 0 } }), /invalid_session/);
check(queries.length === 0, 'tampered ticket performs no database read or write');
let result = concurrent[0];
while (!result.run) result = await move(result.sessionToken, result.revision, result.view.phase === 'reveal' ? { t: 'next' } : { t: 'answer', i: 0 }, ['UPDATE']);
check(result.revision === 20 && rows.get(ticket.id).status === 'complete', 'all ten questions complete with correct persisted revision');
const completeReplay = await move(result.sessionToken, 20, { t: 'answer', i: 1 }, ['SELECT']);
check(completeReplay.revision === 20 && completeReplay.run, 'finished games cannot be rewritten');
runProjectionStarted = false; runProjectionFinished = false;
const finalDaily = { ...flagRemote, create: () => ({ done: false }), reduce: (state, action) => action.t === 'answer' ? { done: true } : state,
  done: state => state.done, payload: () => ({ scoreRaw: 1, scoreMax: 1, scoreSortValue: 1, scoreDisplay: '1', resultJson: {} }) };
const completed = await commitGameSession(finalDaily, state => ({ finished: state.done }), {
  sessionToken: encodeRunTicket({ ...ticket, id: randomUUID(), mode: 'daily' }), revision: 0, action: { t: 'answer', i: 0 },
});
check(completed.success && completed.run && runProjectionFinished && cookieValues.has('cv_streak'), 'completed daily projects result and writes streak concurrently within the request');
console.log(`Session fast-path: ${passed} checks passed. First move: 3 → 1 database calls; normal move: 2 → 1; conflict and legacy fallback remain authoritative.`);
Module._load = load;
