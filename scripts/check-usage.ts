import assert from 'node:assert/strict';
import { usageRoute, validateUsageBatch } from '../src/lib/usage';

let checks = 0;
function check(value: unknown, label: string) { assert(value, label); checks++; }
const id = 'dcd8d321-2038-4f38-b137-148f061fb039';
const valid = validateUsageBatch([{ id, event: 'share_result', game: 'flag-quiz', mode: 'daily', action: 'challenge', outcome: 'clipboard', message: 'private text', name: 'private name', href: '/?token=secret' }]);
check(valid?.length === 1, 'Known event categories accepted');
check(!JSON.stringify(valid).includes('private') && !JSON.stringify(valid).includes('secret'), 'Untrusted extra fields never reach storage');
for (const patch of [{ event: 'anything' }, { game: 'secret' }, { targetGame: 'secret' }, { source: 'server' }, { mode: 'secret' }, { target: '/?token=secret' }, { outcome: 'private text' }, { action: 'private guess' }, { id: 'broken' }]) {
  check(validateUsageBatch([{ id, event: 'navigation', ...patch }]) === null, `Reject invalid field ${Object.keys(patch)[0]}`);
}
check(validateUsageBatch([]) === null && validateUsageBatch(Array.from({ length: 33 }, () => ({ id, event: 'page_view' }))) === null, 'Batches are bounded');
const route = usageRoute('/games/blind-pick/play?mode=practice&challenge=secret&country=USA');
check(route.game === 'blind-pick' && route.mode === 'practice' && route.target === 'play', 'Game route reduced to known categories');
check(!JSON.stringify(route).includes('secret') && !JSON.stringify(route).includes('USA'), 'Query identifiers and choices never enter events');
check(usageRoute('/countries/private-name').target === 'countries', 'Country paths expose only their route category');
check(usageRoute('/games/geo-wordle/leaderboard?day=2026-10-27').target === 'leaderboard', 'Full leaderboard identified without dates or queries');
check(usageRoute('https://external.example/private').target === 'other', 'External URLs are never retained');
check(usageRoute('/').target === 'home' && usageRoute('/privacy').target === 'legal', 'Home and legal route categories');
check(usageRoute('/feedback').target === 'feedback', 'Feedback board has its own usage category');
check(usageRoute('/challenge/private-token').action === 'challenge', 'Incoming challenge page has a bounded attribution category');
check(usageRoute('/games/flag-quiz/play?mode=daily&challenge=private-token').action === 'challenge', 'Challenge start retains attribution without the token');
check(!JSON.stringify(usageRoute('/challenge/private-token')).includes('private-token'), 'Challenge link token is excluded');
console.log(`Usage validation: ${checks} checks passed.`);
