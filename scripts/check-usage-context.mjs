// Actual client queue with isolated browser storage and a stubbed server action.
// Run with node --import tsx scripts/check-usage-context.mjs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const actionId = require.resolve('../src/app/actions/usage.ts');
require.cache[actionId] = { id: actionId, filename: actionId, loaded: true, exports: { recordUsageBatch: () => { throw new Error('No transport expected during a click'); } } };
const storage = new Map();
globalThis.window = {};
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.location = new URL('https://countrivo.com/challenge/private-token');
const schedule = globalThis.setTimeout;
globalThis.setTimeout = () => 1;
let checks = 0;
function check(value, label) { assert(value, label); checks++; }
try {
  const { trackUsage, trackNavigation } = require('../src/lib/usage-events.ts');
  trackUsage('page_view');
  trackNavigation('/games/flag-quiz/play?mode=daily&challenge=private-token');
  globalThis.location = new URL('https://countrivo.com/games/flag-quiz/play?mode=daily&challenge=private-token');
  trackUsage('feedback_open');
  trackUsage('share_intent', { action: 'result' });
  globalThis.location = new URL('https://countrivo.com/');
  trackNavigation('/challenge/private-token');
  const events = JSON.parse(storage.get('cv_usage_queue'));
  check(events[0].event === 'page_view' && events[0].action === 'challenge', 'Incoming challenge visit inherits its category');
  check(events[1].event === 'navigation' && events[1].action === 'challenge' && events[1].targetGame === 'flag-quiz', 'Challenge start keeps attribution and identifies only the destination game');
  check(events[2].event === 'feedback_open' && events[2].action === 'challenge' && events[2].game === 'flag-quiz', 'Generic events inherit the challenge context');
  check(events[3].action === 'result', 'Explicit event properties override route context');
  check(events[4].event === 'navigation' && events[4].action === 'challenge', 'Navigation into a challenge inherits its destination category');
  check(!JSON.stringify(events).includes('private-token'), 'Neither source nor destination token reaches the queue');
  console.log(`Usage challenge context: ${checks} checks passed; no transport or database writes.`);
} finally { globalThis.setTimeout = schedule; }
