import 'server-only';
import { gameDatabase, readDeviceId } from './anonymous-identity';
import { feedbackBoardQuery, publicFeedback, type FeedbackBoardReply } from '@/lib/feedback-board';

export async function readFeedbackBoard(input?: unknown): Promise<FeedbackBoardReply> {
  const query = feedbackBoardQuery(input);
  if (!query) return { success: false, error: 'Choose a valid feedback page.' };
  try {
    const device = await readDeviceId();
    const { data, error } = await gameDatabase().rpc('countrivo_public_feedback_v2', { p_device: device, p_before: query.beforeId, p_limit: query.limit + 1 })
      .abortSignal(AbortSignal.timeout(4000));
    if (error || !Array.isArray(data)) return { success: false, error: 'Could not open feedback. Try again.' };
    const items = data.map(publicFeedback);
    if (items.some(item => item === null)) return { success: false, error: 'Could not open feedback. Try again.' };
    const valid = items.filter(item => item !== null);
    const page = valid.slice(0, query.limit);
    return { success: true, items: page, nextBeforeId: valid.length > query.limit ? page.at(-1)?.id ?? null : null };
  } catch { return { success: false, error: 'Could not open feedback. Try again.' }; }
}
