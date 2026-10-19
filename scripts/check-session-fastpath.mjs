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
let preservedState = null, dailyResolutionStarted = false;
stub('../src/server/daily-board-state.ts', { resolveDailyBoard: async (module, _view, input) => {
  dailyResolutionStarted = true;
  return { seed: input.seed, state: preservedState ?? module.create(input.seed, 'daily', input.dateKey) };
} });
stub('../src/server/board-snapshots.ts', { archivedState: async () => preservedState, frozenBoardState: async () => preservedState,
  frozenBoardSnapshot: async () => preservedState ? {seed:4321,solution:preservedState} : null });
stub('../src/server/leaderboard-bots.ts', { seedRivalsForGame: async () => {} });
const { encodeRunTicket, readRunTicket, signValue } = require('../src/server/anonymous-identity.ts');
const { commitGameSession, prepareGameSession } = require('../src/server/game-sessions.ts');
const { getTodayDateKey } = require('../src/lib/daily-seed.ts');
const { flagRemote, flagView, quickProject, flagSessionModule } = require('../src/server/quick-sessions.ts');
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
const regionalTicket = { ...ticket, id: randomUUID(), practiceRegion: 'europe' };
const regionalModule = await flagSessionModule('practice', dateKey, ticket.edition, 'europe');
const regionalFirst = await commitGameSession(regionalModule, project, { sessionToken: encodeRunTicket(regionalTicket), revision: 0, action: { t: 'answer', i: 0 } });
check(regionalFirst.success && rows.get(regionalTicket.id).state_json.practiceRegion === 'europe', 'regional practice context persists on the first atomic move');
const regionalRead = readRunTicket(regionalFirst.sessionToken);
check(regionalRead.practiceRegion === 'europe', 'regional context survives the encrypted response ticket');
const regionalNext = await commitGameSession(await flagSessionModule(regionalRead.mode, regionalRead.dateKey, regionalRead.edition, regionalRead.practiceRegion), project,
  { sessionToken: regionalFirst.sessionToken, revision: 1, action: { t: 'next' } });
check(regionalNext.success && regionalNext.view.phase === 'playing' && regionalNext.revision === 2, 'the next regional move replays the same pool after module reconstruction');
runProjectionStarted = false; runProjectionFinished = false;
const finalDaily = { ...flagRemote, create: () => ({ done: false }), reduce: (state, action) => action.t === 'answer' ? { done: true } : state,
  done: state => state.done, payload: () => ({ scoreRaw: 1, scoreMax: 1, scoreSortValue: 1, scoreDisplay: '1', resultJson: {} }) };
const completed = await commitGameSession(finalDaily, state => ({ finished: state.done }), {
  sessionToken: encodeRunTicket({ ...ticket, id: randomUUID(), mode: 'daily' }), revision: 0, action: { t: 'answer', i: 0 },
});
check(completed.success && completed.run && runProjectionFinished && cookieValues.has('cv_streak'), 'completed daily projects result and writes streak concurrently within the request');

const contentModule = {...flagRemote,slug:'country-draft',contentVersion:2,create:seed=>({pool:2,seed,picks:[]}),
  reduce:(state,action)=>action.t==='answer'?{...state,picks:[...state.picks,action.i]}:state,done:()=>false};
const contentView = state=>({pool:state.pool,picks:state.picks});
const oldContent = {...ticket,id:randomUUID(),slug:'country-draft',contentVersion:1};
for(const contentVersion of [undefined,1]){
  queries.length=0;
  const changed=await commitGameSession(contentModule,contentView,{sessionToken:encodeRunTicket({...oldContent,contentVersion}),revision:4,action:{t:'answer',i:17}});
  const renewed=readRunTicket(changed.sessionToken);
  check(!changed.success&&changed.reset&&changed.revision===0&&changed.view.pool===2&&changed.view.picks.length===0,'old or unversioned practice never applies an old pick to a new roster');
  check(renewed.id!==oldContent.id&&renewed.contentVersion===2&&!renewed.cursor,'practice reset issues a fresh current-version identity without old cursor');
  check(changed.error==='Practice roster updated. A fresh draft is ready.'&&queries.length===0,'practice reset is explained and performs no database read or write');
}
queries.length=0;
const prepared=await prepareGameSession(contentModule,contentView,{...oldContent,resumeToken:encodeRunTicket(oldContent)});
check(prepared.reset&&prepared.revision===0&&prepared.view.picks.length===0&&queries.length===0,'resuming an old practice token starts fresh before reading or replaying history');
const oldRow={...rows.get(ticket.id),session_id:oldContent.id,game_slug:'country-draft',status:'complete',action_log:'[{"t":"answer","i":17}]',revision:1,
  state_json:{contentVersion:1},score_raw:999,display_name:'Original result'};
const oldSnapshot=JSON.stringify(oldRow);
const completedBefore=await prepareGameSession(contentModule,contentView,oldContent,oldRow);
check(completedBefore.reset&&!completedBefore.run&&completedBefore.view.picks.length===0&&JSON.stringify(oldRow)===oldSnapshot,'completed old practice scores and names are not reconstructed from the new roster');
const versioned=await prepareGameSession(contentModule,contentView,{...oldContent,id:randomUUID()},null);
check(readRunTicket(versioned.sessionToken).contentVersion===2&&!versioned.reset,'new practice is issued with the current roster version');
queries.length=0;
const versionedFirst=await commitGameSession(contentModule,contentView,{sessionToken:versioned.sessionToken,revision:0,action:{t:'answer',i:0}});
check(versionedFirst.success&&versionedFirst.view.picks.length===1&&JSON.stringify(queries)==='["INSERT"]','new versioned practice still needs only one atomic first insert');
const firstVersionedTicket=readRunTicket(versionedFirst.sessionToken);
check(rows.get(firstVersionedTicket.id).state_json.contentVersion===2&&firstVersionedTicket.contentVersion===2,'stored metadata and returned row ticket preserve the content version');
queries.length=0;
const versionedSecond=await commitGameSession(contentModule,contentView,{sessionToken:versionedFirst.sessionToken,revision:1,action:{t:'answer',i:1}});
check(versionedSecond.success&&versionedSecond.view.picks.length===2&&JSON.stringify(queries)==='["UPDATE"]','normal versioned moves retain the single-update fast path');
delete firstVersionedTicket.cursor;
const restored=await commitGameSession(contentModule,contentView,{sessionToken:encodeRunTicket(firstVersionedTicket),revision:2,action:{t:'answer',i:2}});
check(restored.success&&restored.view.picks.length===3&&readRunTicket(restored.sessionToken).contentVersion===2,'database fallback restores a current version instead of dropping it');
rows.set(oldRow.session_id,oldRow);queries.length=0;
const oldStored=await commitGameSession(contentModule,contentView,{sessionToken:encodeRunTicket({...oldContent,contentVersion:2}),revision:1,action:{t:'answer',i:0}});
check(oldStored.reset&&oldStored.view.picks.length===0&&JSON.stringify(rows.get(oldRow.session_id))===oldSnapshot&&JSON.stringify(queries)==='["SELECT"]','a stale stored practice row cannot be replayed even if the supplied ticket claims the current version');
preservedState={pool:1,picks:[],seed:4321};
const frozenDaily=await commitGameSession(contentModule,contentView,{sessionToken:encodeRunTicket({...oldContent,id:randomUUID(),mode:'daily'}),revision:0,action:{t:'answer',i:0}});
check(frozenDaily.success&&!frozenDaily.reset&&frozenDaily.view.pool===1&&frozenDaily.view.picks.length===1,'daily moves use their frozen old roster despite a newer module version');
const yesterday=new Date(Date.parse(`${dateKey}T12:00:00Z`)-86400000).toISOString().slice(0,10);
const frozenArchive=await commitGameSession(contentModule,contentView,{sessionToken:encodeRunTicket({...oldContent,id:randomUUID(),dateKey:yesterday,archived:true}),revision:0,action:{t:'answer',i:0}});
check(frozenArchive.success&&!frozenArchive.reset&&frozenArchive.view.pool===1,'archived practice uses the immutable historical roster, not a fresh current one');
const archivedPrepared=await prepareGameSession(contentModule,contentView,{...oldContent,dateKey:yesterday,archived:true,resumeToken:encodeRunTicket(oldContent)});
check(archivedPrepared.success&&!archivedPrepared.reset&&archivedPrepared.view.pool===1,'opening an archive ignores an unrelated old non-archived resume cookie');
queries.length=0;dailyResolutionStarted=false;
let releaseKnownRun, entrySettled=false;
const pendingKnownRun=new Promise(resolve=>{releaseKnownRun=resolve;});
const pendingEntry=prepareGameSession(contentModule,contentView,{...oldContent,mode:'daily'},pendingKnownRun).then(value=>{entrySettled=true;return value;});
await Promise.resolve();
check(dailyResolutionStarted&&!entrySettled,'immutable board resolution starts while the private own-run read is still pending');
releaseKnownRun(null);
const parallelEntry=await pendingEntry;
check(parallelEntry.success&&parallelEntry.view.pool===1&&queries.length===0,'promised explicit null preserves the frozen daily and never repeats the private lookup');
const knownVersioned=rows.get(firstVersionedTicket.id);
const resumedKnown=await prepareGameSession(contentModule,contentView,{...oldContent,contentVersion:2},Promise.resolve(knownVersioned));
check(resumedKnown.revision===knownVersioned.revision&&resumedKnown.view.picks.length===3&&queries.length===0,'promised saved state resumes its canonical revision without a second database query');
preservedState=null;
check(readRunTicket(encodeRunTicket({...oldContent,contentVersion:-1}))===null,'invalid content-version metadata is rejected');
console.log(`Session fast-path: ${passed} checks passed. First move: 3 → 1 database calls; normal move: 2 → 1; conflict and legacy fallback remain authoritative.`);
Module._load = load;
