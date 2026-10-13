/** Run with NODE_OPTIONS='--conditions=react-server' node --import tsx scripts/check-first-board.mjs. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { createDedupeFetch } from 'next/dist/server/lib/dedupe-fetch.js';
import { renderToReadableStream } from 'next/dist/compiled/react-server-dom-webpack/server.node.js';

registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === 'server-only' ? 'next/dist/compiled/server-only/empty.js' : specifier, context);
} });

const local = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(line => line.includes('=')).map(line => {
  const at = line.indexOf('=');
  return [line.slice(0, at), line.slice(at + 1).replace(/^['"]|['"]$/g, '')];
}));
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'COUNTRIVO_SUPABASE_SERVICE_KEY', 'COUNTRIVO_GAME_SECRET']) {
  assert(local[name], `${name} must be configured locally`);
  process.env[name] = local[name];
}

const { resolveDailyBoard } = await import('../src/server/daily-board-state.ts');
const { gameModule } = await import('../src/games/country-draft/module.ts');
const { draftView } = await import('../src/lib/game-logic/country-draft/public-view.ts');
const { dailyBoardSeed } = await import('../src/server/anonymous-identity.ts');
const { getTodayDateKey } = await import('../src/lib/daily-seed.ts');
const nativeFetch = globalThis.fetch;
const db = createClient(local.NEXT_PUBLIC_SUPABASE_URL, local.COUNTRIVO_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const dateKey = getTodayDateKey(), edition = `qa-rsc-${randomUUID()}`, slug = 'country-draft';
const seed = dailyBoardSeed(slug, dateKey, edition);
let readsWithoutSignal = 0, freshReads = 0, writes = 0, completed = false;
const renderErrors = [];

function snapshotQuery() {
  return db.from('countrivo_boards').select('seed,solution').eq('game_slug', slug).eq('date_key', dateKey).eq('edition', edition).maybeSingle();
}

globalThis.fetch = createDedupeFetch(async (input, options) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/rest/v1/countrivo_boards') && url.includes(edition)) {
    if ((options?.method ?? 'GET') === 'GET') {
      if (options?.signal) freshReads += 1;
      else readsWithoutSignal += 1;
    }
  }
  if (url.endsWith('/rest/v1/countrivo_boards?on_conflict=game_slug%2Cdate_key%2Cedition') && options?.method === 'POST') writes += 1;
  return nativeFetch(input, options);
});

async function FirstBoard() {
  const first = await snapshotQuery(), duplicate = await snapshotQuery();
  assert.equal(first.error, null);
  assert.equal(first.data, null);
  assert.equal(duplicate.data, null);
  assert.equal(readsWithoutSignal, 1, 'The control must actually run inside an active React request cache');
  const preserved = await resolveDailyBoard(gameModule, draftView, { slug, dateKey, edition, seed });
  assert.equal(preserved.seed, seed);
  assert.deepEqual(preserved.state, gameModule.create(seed, 'daily', dateKey));
  assert.equal(freshReads, 2, 'Initial lookup and canonical reread must both reach the database');
  assert.equal(writes, 1, 'A first rendering must preserve exactly one snapshot');
  const staleControl = await snapshotQuery();
  assert.equal(staleControl.data, null, 'An unsignalled GET still sees the memoized missing row in this same render');
  assert.equal(readsWithoutSignal, 1);
  completed = true;
  return React.createElement('p', null, 'first-board-ready');
}

try {
  const stream = await renderToReadableStream(React.createElement(FirstBoard), {}, { onError: error => renderErrors.push(error) });
  const flight = await new Response(stream).text();
  assert.equal(renderErrors.length, 0, renderErrors[0]?.message);
  assert(completed && flight.includes('first-board-ready'), 'First RSC rendering must finish without a retry');
  const actual = await db.from('countrivo_boards').select('edition', { count: 'exact' }).eq('game_slug', slug).eq('date_key', dateKey).eq('edition', edition);
  assert.equal(actual.error, null);
  assert.equal(actual.count, 1);
  console.log('PASS first missing daily board completes in one real React Server Component rendering.');
  console.log('PASS cache control: duplicate unsignalled reads hit the network once and retain null; both signalled canonical reads are fresh.');
} finally {
  globalThis.fetch = nativeFetch;
  const { error } = await db.from('countrivo_boards').delete().eq('game_slug', slug).eq('date_key', dateKey).eq('edition', edition);
  if (error) throw new Error('Could not remove the isolated QA snapshot');
  console.log('Isolated QA edition removed; actual daily snapshots, runs, bots and configuration untouched.');
}
