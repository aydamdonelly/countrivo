import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { optionalResultContext } = require('../src/lib/optional-result-context.ts');
const originalSet = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
const timers = new Set(), unhandled = [];
const recordUnhandled = error => unhandled.push(error);
process.on('unhandledRejection', recordUnhandled);
globalThis.setTimeout = (callback, delay, ...args) => {
  const timer = originalSet(() => { timers.delete(timer); callback(...args); }, delay);
  timers.add(timer);
  return timer;
};
globalThis.clearTimeout = timer => { timers.delete(timer); originalClear(timer); };
try {
  let budget;
  assert.equal(await optionalResultContext(async value => { budget = value; return 'ready'; }, 'unavailable', 100), 'ready');
  assert.equal(budget.active(), false, 'settled work cannot start follow-up reads');
  assert.equal(timers.size, 0, 'fast success clears its deadline timer');
  assert.equal(await optionalResultContext(async () => { throw new Error('optional failure'); }, 'unavailable', 100), 'unavailable');
  assert.equal(timers.size, 0, 'fast failure clears its deadline timer');
  let reject;
  const pending = new Promise((_resolve, fail) => { reject = fail; });
  assert.equal(await optionalResultContext(async value => { budget = value; return pending; }, 'unavailable', 20), 'unavailable');
  assert.equal(budget.active(), false, 'deadline remains expired after fallback');
  assert.equal(timers.size, 0, 'timeout leaves no deadline timer');
  reject(new Error('late safe-read failure'));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(unhandled, [], 'a late failed read is handled after the score response returns');
  console.log('check-optional-result-context: success, error, deadline, late rejection and timer cleanup passed');
} finally {
  globalThis.setTimeout = originalSet; globalThis.clearTimeout = originalClear;
  process.off('unhandledRejection', recordUnhandled);
}
