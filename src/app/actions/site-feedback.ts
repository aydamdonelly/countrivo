"use server";

import { saveFeedback, validateFeedback, type FeedbackReply } from "@/lib/site-feedback";
import { ensureDeviceId, gameDatabase, signValue } from "@/server/anonymous-identity";
import { readFeedbackBoard } from '@/server/feedback-board';
import { feedbackVoteInput, publicFeedback, type FeedbackBoardReply, type FeedbackVoteReply, type FeedbackModerationReply, type FeedbackBlockReply } from '@/lib/feedback-board';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { dailyNetworkHash } from '@/server/abuse-identity';
import { feedbackIdInput, feedbackReportInput } from '@/lib/feedback-moderation';

export async function submitSiteFeedback(input: unknown): Promise<FeedbackReply> {
  const result = validateFeedback(input);
  if (!result.valid) return result.reply;
  try {
    const deviceId = await ensureDeviceId();
    const reply = await saveFeedback(result.value, deviceId, gameDatabase());
    if (reply.success && result.value.visibility === 'public') revalidatePath('/feedback');
    return reply;
  } catch {
    return { success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." };
  }
}

export async function loadFeedbackBoard(input?: unknown): Promise<FeedbackBoardReply> {
  return readFeedbackBoard(input);
}

export async function voteFeedback(input: unknown): Promise<FeedbackVoteReply> {
  const vote = feedbackVoteInput(input);
  if (!vote) return { success: false, code: 'invalid', error: 'Choose an upvote or downvote.' };
  try {
    const device = await ensureDeviceId();
    const { data, error } = await gameDatabase().rpc('countrivo_vote_feedback', { p_device: device, p_feedback: vote.feedbackId, p_value: vote.value, p_request: vote.requestId })
      .abortSignal(AbortSignal.timeout(4000));
    if (error?.message.includes('feedback_vote_rate_limited')) return { success: false, code: 'rate_limited', error: 'You’ve voted often. Please wait before voting again.' };
    if (error?.message.includes('feedback_vote_invalid')) return { success: false, code: 'invalid', error: 'Reopen the feedback board and try again.' };
    const item = !error && Array.isArray(data) ? publicFeedback(data[0]) : null;
    return item ? { success: true, item } : { success: false, code: 'unavailable', error: 'Could not save this vote. The post may no longer be available.' };
  } catch { return { success: false, code: 'unavailable', error: 'Could not save this vote. Try again.' }; }
}

export async function reportFeedback(input: unknown): Promise<FeedbackModerationReply> {
  const report = feedbackReportInput(input);
  if (!report) return { success: false, error: 'Choose a reason for your report.' };
  try {
    const device = await ensureDeviceId();
    const { error } = await gameDatabase().rpc('countrivo_report_feedback', { p_feedback: report.feedbackId, p_device: device, p_ip: await dailyNetworkHash(), p_reason: report.reason }).abortSignal(AbortSignal.timeout(4000));
    if (error) return { success: false, error: error.message.includes('report_throttled') ? 'Too many reports today. Please contact countrivo@gmail.com.' : 'Could not send this report. The post may no longer be available.' };
    revalidatePath('/feedback');
    return { success: true };
  } catch { return { success: false, error: 'Could not send this report. Try again.' }; }
}

export async function blockFeedbackAuthor(input: unknown): Promise<FeedbackBlockReply> {
  const id = feedbackIdInput(input);
  if (!id) return { success: false, error: 'Choose a public feedback post.' };
  try {
    const device = await ensureDeviceId();
    const { error } = await gameDatabase().rpc('countrivo_block_feedback_author', { p_feedback: id, p_viewer: device }).abortSignal(AbortSignal.timeout(4000));
    if (error) return { success: false, error: error.message.includes('block_limit') ? 'Your blocked-author list is full.' : 'Could not block this author. The post may no longer be available.' };
    (await cookies()).set('cv_blocks', signValue('enabled'), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 63072000 });
    revalidatePath('/feedback');
    return { success: true, board: await readFeedbackBoard() };
  } catch { return { success: false, error: 'Could not block this author. Try again.' }; }
}
