export const FEEDBACK_REPORT_REASONS = [
  'Harassment or bullying', 'Hate or discrimination', 'Sexual or graphic content',
  'Personal information', 'Spam or advertising', 'Other concern',
] as const;
export type FeedbackReportReason = typeof FEEDBACK_REPORT_REASONS[number];

// Public text has a different vocabulary from handles: ordinary criticism and
// words such as “support”, “admin” and “country” must remain valid feedback.
const blockedWords = ['nigger', 'nigga', 'faggot', 'cunt', 'fuck', 'shit', 'bitch', 'whore', 'slut', 'porn', 'pedophile'];
const offensive = new RegExp(`(?:^|[^a-z])(?:${blockedWords.map(word => word.split('').join('[^a-z0-9]*')).join('|')})(?:s|ing|er|ers)?(?:$|[^a-z])`, 'i');
const substitutions: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

export function isAllowedPublicFeedback(message: string): boolean {
  const normalized = message.normalize('NFKC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g, '');
  return !offensive.test(normalized) && !offensive.test(normalized.replace(/[013457@$!]/g, value => substitutions[value]));
}

export function feedbackReportInput(input: unknown): { feedbackId: number; reason: FeedbackReportReason } | null {
  if (!input || typeof input !== 'object' || !('feedbackId' in input) || typeof input.feedbackId !== 'number' || !Number.isSafeInteger(input.feedbackId) || input.feedbackId < 1 || !('reason' in input)) return null;
  const reason = FEEDBACK_REPORT_REASONS.find(value => value === input.reason);
  return reason ? { feedbackId: input.feedbackId, reason } : null;
}

export function feedbackIdInput(input: unknown): number | null {
  return typeof input === 'number' && Number.isSafeInteger(input) && input > 0 ? input : null;
}
