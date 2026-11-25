// Exercise real mutation handlers with in-memory persistence and cache boundaries.
import assert from 'node:assert/strict';
import Module from 'node:module';
import {require as tsxRequire} from 'tsx/cjs/api';

const day = '2026-10-27', device = '11111111-1111-4111-8111-111111111111';
let ticket, row, accepted = true, rpcError = false, paths = [], tagInvalidations = 0, cookieWrites = 0;
const database = {
  from() {
    let write, owned = false;
    const query = {
      insert(value) { write = value; return query; },
      update(value) { write = value; return query; },
      select(fields) { owned = fields === 'mode'; return query; },
      eq() { return query; },
      async maybeSingle() {
        if (write && !accepted) return {data:null, error:null};
        if (write) row = {...row, ...write};
        return {data:owned ? {mode:row.mode} : row, error:null};
      },
    };
    return query;
  },
  rpc(_name, values) {
    return {async returns() {return rpcError ? {data:null,error:{message:'network_throttled'}} : {data:[{...row,display_name:values.p_name}],error:null};}};
  },
};
const originalLoad = Module._load, originalFetch = globalThis.fetch;
globalThis.fetch = () => {throw new Error('Network access is forbidden in this check');};
Module._load = function(request, parent, isMain) {
  if(request === 'server-only')return {};
  if(request === 'next/cache')return {revalidatePath:path => paths.push(path)};
  if(request === 'next/headers')return {cookies:async () => ({get:() => ({value:JSON.stringify({days:[day],current:1,best:1,played:1})}),set:() => {cookieWrites++;}})};
  if(/(?:^|\/)anonymous-identity(?:\.ts)?$/.test(request))return {readRunTicket:() => ticket,encodeRunTicket:() => 'signed-test-ticket',ensureDeviceId:async () => device,readDeviceId:async () => device,gameDatabase:() => database};
  if(/(?:^|\/)anonymous-runs(?:\.ts)?$/.test(request))return {mapAnonymousRun:async value => ({id:value.id,gameSlug:value.game_slug,mode:value.mode,scoreDisplay:value.score_display}),invalidateAnonymousLeaderboards:() => {tagInvalidations++;}};
  if(/(?:^|\/)daily-seed(?:\.ts)?$/.test(request))return {getTodayDateKey:() => day};
  if(/(?:^|\/)edition(?:\.ts)?$/.test(request))return {getEdition:async () => 'test-edition'};
  if(/(?:^|\/)daily-board-state(?:\.ts)?$/.test(request))return {resolveDailyBoard:async game => ({state:game.create()})};
  if(/(?:^|\/)board-snapshots(?:\.ts)?$/.test(request))return {};
  if(/(?:^|\/)abuse-identity(?:\.ts)?$/.test(request))return {dailyNetworkHash:async () => 'test-network'};
  if(/(?:^|\/)replay-submission(?:\.ts)?$/.test(request))return {};
  if(request.endsWith('/data/games'))return {getGameBySlug:() => ({availableModes:['daily','practice']})};
  if(request.endsWith('/data/loader'))return {countries:[],sovereignIso3:[]};
  return originalLoad.call(this, request, parent, isMain);
};

function reset(mode, revision) {
  paths = []; tagInvalidations = 0; cookieWrites = 0; accepted = true; rpcError = false;
  ticket = {id:'test-session',slug:'country-draft',mode,dateKey:day,edition:'test-edition',seed:1,startedAt:`${day}T12:00:00Z`,contentVersion:1,
    ...(revision ? {cursor:{deviceId:device,revision,actionLog:'m'.repeat(revision)}} : {})};
  row = {id:1,session_id:ticket.id,device_id:device,game_slug:ticket.slug,mode,date_key:day,edition:ticket.edition,seed:1,
    status:revision >= 3 ? 'complete' : 'open',revision,action_log:'m'.repeat(revision),started_at:ticket.startedAt,state_json:{contentVersion:1},display_name:'guest-test',score_display:'3'};
}

try {
  const {commitGameSession} = tsxRequire('../src/server/game-sessions.ts', import.meta.url);
  const {publishAnonymousRun,withdrawLeaderboardName} = tsxRequire('../src/app/actions/anonymous-games.ts', import.meta.url);
  const game = {slug:'country-draft',contentVersion:1,create:() => ({moves:0}),reduce:state => ({moves:state.moves+1}),done:state => state.moves === 3,
    codec:{enc:actions => 'm'.repeat(actions.length),dec:log => [...log].map(() => ({t:'move'}))},
    payload:() => ({scoreRaw:3,scoreMax:3,scoreSortValue:3,scoreDisplay:'3',resultJson:{}})};
  for(const mode of ['daily','practice'])for(const revision of [0,1,2]) {
    reset(mode,revision);
    const result = await commitGameSession(game, state => state, {sessionToken:'test-ticket',revision,action:{t:'move'}});
    assert(result.success && result.revision === revision+1, 'Real commit handler accepts and returns the stored revision');
    assert.deepEqual(paths, mode === 'practice' || revision === 1 ? [] : revision === 0 ? ['/'] : ['/','/games','/games/country-draft/leaderboard']);
    assert.equal(tagInvalidations, mode === 'daily' && revision === 2 ? 1 : 0);
    assert.equal(cookieWrites,0,'Same-day completion freshness does not rely on another streak cookie');
  }
  reset('daily',1); accepted = false; row.revision = 2; row.action_log = 'mm';
  const retry = await commitGameSession(game, state => state, {sessionToken:'test-ticket',revision:1,action:{t:'move'}});
  assert(retry.success && retry.revision === 2, 'A repeated move returns the authoritative stored revision');
  assert.deepEqual(paths,[],'A retry does not repeat navigation invalidation');
  reset('daily',3);
  assert((await publishAnonymousRun(1,'Test Player')).success);
  assert.deepEqual(paths,['/','/games/country-draft/leaderboard']);
  assert.equal(tagInvalidations,1);
  reset('daily',3);
  assert((await withdrawLeaderboardName(1)).success);
  assert.deepEqual(paths,['/','/games/country-draft/leaderboard']);
  reset('daily',3); rpcError = true;
  assert.equal((await publishAnonymousRun(1,'Test Player')).success,false);
  assert.deepEqual(paths,[],'Rejected name edits do not invalidate navigation');
  console.log('Navigation freshness: first move, intermediate move, same-day completion, practice, retry, rename and guest reset pass; no network writes.');
} finally {
  Module._load = originalLoad;
  globalThis.fetch = originalFetch;
}
