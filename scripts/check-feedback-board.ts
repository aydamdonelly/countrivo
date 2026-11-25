import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { feedbackBoardQuery, feedbackVoteInput, publicFeedback } from '../src/lib/feedback-board';
import { saveFeedback, validateFeedback, type FeedbackDatabase } from '../src/lib/site-feedback';

let checks = 0;
function check(value: unknown, label: string) { assert(value, label); checks++; }
const input = { message: 'Please add an easier practice mode.', scope: 'site', context: 'site', website: '', submissionId: randomUUID() };
const legacy = validateFeedback(input);
check(legacy.valid && legacy.value.visibility === 'private', 'Old clients keep their explicit private expectation');
const published = validateFeedback({ ...input, visibility: 'public' });
check(published.valid && published.value.visibility === 'public', 'New public submissions opt in explicitly');
check(!validateFeedback({ ...input, visibility: 'secret' }).valid, 'Unknown visibility rejected');
const calls: unknown[] = [];
const database: FeedbackDatabase = { rpc: async (_name, args) => { calls.push(args); return { error: null }; } };
async function main() {
  if (!legacy.valid || !published.valid) throw new Error('Fixture validation failed');
  await saveFeedback(legacy.value, randomUUID(), database);
  await saveFeedback(published.value, randomUUID(), database);
  check(!JSON.stringify(calls[0]).includes('p_public'), 'Legacy RPC signature remains unchanged');
  check(JSON.stringify(calls[1]).includes('"p_public":true'), 'Public RPC receives the explicit publication flag');
  check(feedbackBoardQuery(undefined)?.limit === 20 && feedbackBoardQuery({ limit: 100 })?.limit === 100, 'Read page defaults and upper bound');
  for (const query of [null, { limit: 0 }, { limit: 101 }, { beforeId: -1 }, { beforeId: '123' }, { beforeId: Number.MAX_SAFE_INTEGER + 1 }]) check(feedbackBoardQuery(query) === null, 'Invalid pagination rejected');
  for (const value of [-1, 0, 1]) check(feedbackVoteInput({ feedbackId: 123, value, requestId: randomUUID() })?.value === value, 'Explicit vote target accepted');
  for (const vote of [{ value: 2 }, { value: '1' }, { requestId: 'bad' }, { feedbackId: 0 }, { feedbackId: Number.MAX_SAFE_INTEGER + 1 }]) check(feedbackVoteInput({ feedbackId: 123, value: 1, requestId: randomUUID(), ...vote }) === null, 'Invalid vote rejected');
  const row = { id: 123, message: 'Public version only.', scope: 'site', context: 'site', game_slug: null, created_at: new Date().toISOString(), source: 'reviewed', upvotes: 3, downvotes: 1, vote: -1, device_id: 'PRIVATE_DEVICE', submission_id: 'PRIVATE_SUBMISSION', original_message: 'PRIVATE_ORIGINAL' };
  const dto = publicFeedback(row);
  check(dto?.score === 2 && dto.vote === -1 && dto.source === 'reviewed', 'Counts, own vote and publication source are projected');
  check(!JSON.stringify(dto).includes('PRIVATE_'), 'Private identifiers and original text never enter DTO');
  for (const patch of [{ id: 0 }, { upvotes: -1 }, { vote: 2 }, { game_slug: 'not-a-game' }, { source: null }, { created_at: 'bad' }]) check(publicFeedback({ ...row, ...patch }) === null, 'Malformed database projection fails closed');
  console.log(`Feedback board: ${checks} validation, visibility and privacy checks passed.`);
}
void main();
