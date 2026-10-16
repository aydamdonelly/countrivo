import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';

// Render the actual server-page trees with isolated records. No database requests or writes.
const require = createRequire(import.meta.url), load = Module._load;
Module._load = function (name, parent, main) {
  return name === 'server-only' || name.endsWith('.css') ? {} : load.call(this, name, parent, main);
};
const React = require('react');
globalThis.React = React;
function stub(name, exports) {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
let allowed = true, reportError = false, olderError = false;
const recent = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, device_id: `publisher-${i}`, date_key: '2026-10-15', display_name: `Recent ${i + 1}`, game_slug: 'country-draft', score_display: '145 / 195', moderation_hidden: false }));
const old = { ...recent[0], id: 1001, display_name: 'Older reported name', date_key: '2026-09-01' };
const withdrawn = { ...old, id: 1002, display_name: null };
let reports = [
  { run_id: old.id, reason: 'Report on an archived name' },
  { run_id: 1, reason: 'First report' },
  { run_id: 1, reason: 'Second report' },
  { run_id: withdrawn.id, reason: 'Name already withdrawn' },
];
const reads = [];
const db = { from(table) {
  const query = { table, ids: null, notNull: false, limit: null };
  reads.push(query);
  return {
    select() { return this; },
    order() { return this; },
    like() { return this; },
    not(key, op, value) { assert.equal(key, 'display_name'); assert.equal(op, 'is'); assert.equal(value, null); query.notNull = true; return this; },
    in(key, ids) { assert.equal(key, 'id'); assert.ok(ids.length); query.ids = ids; return this; },
    limit(count) { query.limit = count; return this; },
    async returns() {
      if (table === 'countrivo_name_reports') return { data: reportError ? null : reports, error: reportError ? { message: 'offline' } : null };
      if (table === 'countrivo_publisher_bans') return { data: [], error: null };
      assert.equal(table, 'countrivo_runs');
      if (!query.ids) return { data: recent, error: null };
      assert.equal(query.notNull, true);
      return { data: olderError ? null : [old, withdrawn].filter(row => query.ids.includes(row.id) && row.display_name !== null), error: olderError ? { message: 'offline' } : null };
    },
  };
} };
stub('../src/server/admin-session.ts', { hasAdminSession: async () => allowed });
stub('../src/server/anonymous-identity.ts', { gameDatabase: () => db });
stub('../src/app/actions/admin.ts', Object.fromEntries(['openAdmin', 'closeAdmin', 'setNameVisibility', 'prepareTomorrowBoards', 'banNamePublisher', 'unbanNamePublisher'].map(key => [key, () => {}])));
stub('../src/ui/clay.tsx', { Clay: () => null });
const Admin = require('../src/app/(app)/admin/page.tsx').default;
function nodes(root, matches) {
  const found = [];
  function walk(value) {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object' || !('props' in value)) return;
    if (matches(value)) found.push(value);
    walk(value.props.children);
  }
  walk(root);
  return found;
}
const props = { searchParams: Promise.resolve({}) };
let tree = await Admin(props);
const rows = nodes(tree, node => node.props.className === 'admin-row');
const names = rows.map(row => nodes(row, node => node.type === 'b')[0].props.children);
assert.equal(rows.length, 101, '100 recent names plus an older reported name are available');
assert.deepEqual(names.slice(0, 3), [old.display_name, 'Recent 1', 'Recent 2'], 'reported names come before the remaining recent names');
assert.equal(names.filter(name => name === 'Recent 1').length, 1, 'multiple reports never duplicate a name');
assert.equal(nodes(rows[1], node => node.props.className === 't-meta text-ember').length, 2, 'all recent reasons for that name remain visible');
assert.deepEqual(reads.find(read => read.ids)?.ids, [1001, 1002], 'only report targets missing from the latest names need another query');
assert.ok(!names.includes(null), 'a withdrawn report target is skipped safely');
reports = []; reads.length = 0;
assert.equal(nodes(await Admin(props), node => node.props.className === 'admin-row').length, 100);
assert.ok(!reads.some(read => read.ids), 'no reports means no empty IN query');
reportError = true;
await assert.rejects(() => Admin(props), /Could not open name reports/, 'report-query failures cannot masquerade as an empty queue');
reportError = false; reports = [{ run_id: old.id, reason: 'Older name' }]; olderError = true;
await assert.rejects(() => Admin(props), /Could not open reported names/, 'reported-name failures cannot silently drop an older report');
olderError = false; allowed = false; reads.length = 0;
await Admin(props);
assert.equal(reads.length, 0, 'unauthenticated admin never fetches reports or device identifiers');

let detail = { runId: 7, isOwn: false, gameSlug: 'country-draft', dailyDate: '2026-10-15', displayName: 'Public nickname', username: 'Public nickname', scoreDisplay: '145 / 195', scoreRaw: 145, rankDaily: 1, resultJson: null };
stub('../src/app/actions/game-runs.ts', { getRunDetail: async () => detail, getDailySummary: async () => ({ playerCount: 1 }) });
stub('../src/lib/data/registry.ts', { getGameBySlug: () => ({ title: 'Country Draft' }) });
stub('../src/server/boards.ts', { compactScore: value => value });
stub('../src/games/registry.ts', { isPlayable: () => false, RUN_DETAILS: {} });
stub('../src/ui/index.ts', { Button: () => null, Crest: () => null, ResultPanel: () => null });
function ReportName() { return null; }
stub('../src/features/social/report-name.tsx', { ReportName });
const { RunPage } = require('../src/features/social/run-page.tsx');
let reportControls = nodes(await RunPage({ slug: 'country-draft', runId: '7' }), node => node.type === ReportName);
assert.equal(reportControls.length, 1, 'a public foreign nickname has report and block controls on the shared run');
assert.equal(reportControls[0].props.runId, 7); assert.equal(reportControls[0].props.name, detail.displayName);
detail = { ...detail, isOwn: true };
assert.equal(nodes(await RunPage({ slug: 'country-draft', runId: '7' }), node => node.type === ReportName).length, 0, 'own results never invite self-blocking or self-reporting');
Module._load = load;
console.log('Name moderation regression passed: archived reports, deduplication, ordering, withdrawn names, empty/error queries, admin authorization and public/own run controls.');
