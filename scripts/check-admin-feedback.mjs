// Actual admin server component, isolated DB/auth fixtures, and read-only rendered layout.
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url), load = Module._load;
Module._load = function(name, parent, main) { return name === 'server-only' || name.endsWith('.css') ? {} : load.call(this, name, parent, main); };
const React = require('react'); globalThis.React = React;
const { renderToStaticMarkup } = require('react-dom/server');
function stub(name, exports) { const id = require.resolve(name); require.cache[id] = { id, filename: id, loaded: true, exports }; }
let allowed = false, mode = 'ready', databaseCalls = 0;
const reads = [];
const message = '<script>window.__feedbackExecuted=true</script>\nThe result controls need clearer labels.';
const entries = [
  { id: 1, scope: 'game', game_slug: 'country-draft', context: 'result', message, created_at: '2026-10-21T08:41:21.77786+00:00', device_id: 'PRIVATE-DEVICE-MUST-NOT-APPEAR' },
  { id: 2, scope: 'site', game_slug: null, context: 'site', message: 'W'.repeat(1500), created_at: '2026-10-21T07:30:00Z' },
];
function nodes(root, matches) {
  const found = [];
  function walk(value) { if (Array.isArray(value)) return value.forEach(walk); if (!value || typeof value !== 'object' || !('props' in value)) return; if (matches(value)) found.push(value); walk(value.props.children); }
  walk(root); return found;
}
const db = { from(table) {
  const query = { table, fields: null, limit: null, orders: [], signal: null }; reads.push(query);
  const response = async () => {
    if (table === 'countrivo_site_feedback') {
      if (mode === 'throw') throw new Error('private internal DB detail');
      if (mode === 'timeout') await new Promise(resolve => query.signal.addEventListener('abort', resolve, { once: true }));
      return { data: mode === 'empty' ? [] : mode === 'ready' ? entries.slice(0, query.limit) : null, error: mode === 'error' || mode === 'timeout' ? { message: 'private internal DB detail' } : null };
    }
    if (table === 'countrivo_runs') return { data: [{ id: 9, device_id: 'PRIVATE-MODERATION-DEVICE', date_key: '2026-10-21', display_name: 'QA moderation name', game_slug: 'country-draft', score_display: '145 / 195', moderation_hidden: false }], error: null };
    if (table === 'countrivo_name_reports') return { data: [{ run_id: 9, reason: 'QA moderation reason' }], error: null };
    return { data: [], error: null };
  };
  return { select(fields) { query.fields = fields; return this; }, order(key, options) { query.orders.push({ key, ...options }); return this; },
    not() { return this; }, like() { return this; }, in() { return this; }, limit(limit) { query.limit = limit; return this; }, abortSignal(signal) { query.signal = signal; return this; },
    returns: response, then(resolve, reject) { return response().then(resolve, reject); } };
} };
stub('../src/server/admin-session.ts', { hasAdminSession: async () => allowed });
stub('../src/server/anonymous-identity.ts', { gameDatabase: () => { databaseCalls++; return db; } });
stub('../src/app/actions/admin.ts', Object.fromEntries(['openAdmin', 'closeAdmin', 'setNameVisibility', 'prepareTomorrowBoards', 'banNamePublisher', 'unbanNamePublisher'].map(name => [name, () => {}])));
stub('../src/ui/clay.tsx', { Clay: () => null });
const Admin = require('../src/app/(app)/admin/page.tsx').default;
const props = { searchParams: Promise.resolve({}) };
let checks = 0;
function check(value, note) { assert(value, note); checks++; }
const guard = await Admin(props);
check(databaseCalls === 0 && reads.length === 0, 'Unauthenticated page never instantiates or queries the private database');
check(nodes(guard, node => node.props.className === 'admin-feedback').length === 0, 'Unauthenticated markup contains no inbox');
allowed = true;
let tree = await Admin(props);
const inbox = nodes(tree, node => node.props.className === 'admin-feedback')[0];
const html = renderToStaticMarkup(inbox);
const query = reads.find(read => read.table === 'countrivo_site_feedback');
check(query.fields === 'id,scope,game_slug,context,message,created_at', 'Feedback query selects only display fields, never device IDs');
check(query.limit === 50, 'Inbox is bounded to the latest50 messages');
assert.deepEqual(query.orders, [{ key: 'created_at', ascending: false }, { key: 'id', ascending: false }]); checks++;
check(query.signal instanceof AbortSignal, 'Private feedback read has a timeout signal');
check(html.includes('This game') && html.includes('Country Draft') && html.includes('After a result') && html.includes('Whole site'), 'Scope/game/context remain understandable');
check(html.includes('&lt;script&gt;') && !html.includes('<script>'), 'Feedback is escaped text, never executable HTML');
check(!html.includes('PRIVATE-DEVICE') && !html.includes('PRIVATE-MODERATION-DEVICE'), 'No device identifier enters inbox markup');
check(html.includes('Europe/Berlin') && nodes(inbox, node => node.type === 'time')[0].props.dateTime === entries[0].created_at, 'Timestamp is machine-readable with an explicit display zone');
check(nodes(inbox, node => node.type === 'form' || node.type === 'button').length === 0, 'Reading feedback introduces no mutations');
check(nodes(tree, node => node.props.className === 'admin-row').length === 1, 'Existing moderation remains present');
for (mode of ['error', 'throw', 'empty']) {
  tree = await Admin(props);
  const section = nodes(tree, node => node.props.className === 'admin-feedback')[0];
  const state = renderToStaticMarkup(section);
  check(nodes(tree, node => node.props.className === 'admin-row').length === 1, `${mode}: moderation is not blanked`);
  check(!state.includes('private internal DB detail'), `${mode}: internal errors stay private`);
  check(mode === 'empty' ? state.includes('No feedback yet.') : state.includes('Feedback could not be opened.'), `${mode}: empty and failed reads are distinguished`);
}
mode = 'timeout'; const started = performance.now(); const keepAlive = setTimeout(() => {}, 4500);
try { tree = await Admin(props); } finally { clearTimeout(keepAlive); }
const timeoutMs = performance.now() - started;
check(timeoutMs >= 2400 && timeoutMs < 4000, 'Timeout does not leave the owner page waiting indefinitely');
check(nodes(tree, node => node.props.className === 'admin-row').length === 1, 'Timed-out inbox preserves moderation content');
check(renderToStaticMarkup(nodes(tree, node => node.props.className === 'admin-feedback')[0]).includes('Feedback could not be opened.'), 'Timeout gets an honest retry message');
mode = 'ready'; Module._load = load;

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const out = '.check-render/admin-feedback'; mkdirSync(out, { recursive: true });
const tokens = readFileSync('src/styles/tokens.css', 'utf8').replace(/@import[^;]+;/g, '').replace('@theme', ':root');
const css = tokens + readFileSync('src/app/(app)/admin/admin-feedback.css', 'utf8') + 'body{margin:0;padding:20px;font:16px/1.5 system-ui;background:var(--color-paper);color:var(--color-ink)}main{max-width:720px;margin:auto}.t-meta{font-size:13px}.text-mute{color:var(--color-mute)}p{margin:12px 0}h2{font-size:24px}';
try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    await page.route('**/*', route => route.abort());
    await page.setContent(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><main>${html}</main></html>`);
    check(await page.getByRole('region', { name: 'Private feedback', exact: true }).count() === 1, 'Inbox has a labelled landmark');
    check(await page.getByRole('list', { name: 'Latest private feedback', exact: true }).getByRole('listitem').count() === 2, 'Messages use native list semantics');
    check(await page.locator('.admin-feedback-message').first().innerText() === message, 'Line breaks and literal markup remain readable');
    check(await page.locator('.admin-feedback-message').nth(1).innerText() === entries[1].message, 'Long feedback text remains complete');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Long text fits${viewport.width}px without horizontal overflow`);
    check(await page.evaluate(() => window.__feedbackExecuted === undefined), 'Untrusted feedback does not execute');
    await page.screenshot({ path: `${out}/inbox-${viewport.width}.png`, fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(`${out}/checks.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, timeoutMs: Math.round(timeoutMs), fixtureOnly: true, databaseWrites: 0, authGuardNoQuery: true, noDeviceIdentifiersInMarkup: true }, null, 2) + '\n');
console.log(`check-admin-feedback:${checks} auth, privacy, escaping, timeout and responsive checks passed; no real DB requests/writes`);
