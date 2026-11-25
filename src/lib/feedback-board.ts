import { isGameSlug, type GameSlug } from '@/ui/types';
import type { FeedbackContext, FeedbackScope } from './site-feedback';

export type FeedbackVote = -1 | 0 | 1;
export interface PublicFeedback {
  id: number;
  message: string;
  scope: FeedbackScope;
  context: FeedbackContext;
  gameSlug: GameSlug | null;
  createdAt: string;
  source: 'player' | 'reviewed';
  upvotes: number;
  downvotes: number;
  score: number;
  vote: FeedbackVote;
  own: boolean;
}
export interface FeedbackBoardQuery { beforeId?: number; limit?: number; }
export type FeedbackBoardReply = { success: true; items: PublicFeedback[]; nextBeforeId: number | null } | { success: false; error: string };
export interface FeedbackVoteInput { feedbackId: number; value: FeedbackVote; requestId: string; }
export type FeedbackVoteReply = { success: true; item: PublicFeedback } | { success: false; code: 'invalid' | 'rate_limited' | 'unavailable'; error: string };
export type FeedbackModerationReply = { success: true } | { success: false; error: string };
export type FeedbackBlockReply = { success: true; board: FeedbackBoardReply } | { success: false; error: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function record(input: unknown): input is Record<string, unknown> { return !!input && typeof input === 'object' && !Array.isArray(input); }
function positiveId(input: unknown): input is number { return typeof input === 'number' && Number.isSafeInteger(input) && input > 0; }
function count(input: unknown): input is number { return typeof input === 'number' && Number.isSafeInteger(input) && input >= 0; }

export function feedbackBoardQuery(input: unknown): { beforeId: number | null; limit: number } | null {
  if (input === undefined) return { beforeId: null, limit: 20 };
  if (!record(input)) return null;
  if (input.beforeId !== undefined && !positiveId(input.beforeId)) return null;
  if (input.limit !== undefined && (!positiveId(input.limit) || input.limit > 100)) return null;
  return { beforeId: typeof input.beforeId === 'number' ? input.beforeId : null, limit: typeof input.limit === 'number' ? input.limit : 20 };
}

export function feedbackVoteInput(input: unknown): FeedbackVoteInput | null {
  if (!record(input) || !positiveId(input.feedbackId) || (input.value !== -1 && input.value !== 0 && input.value !== 1) || typeof input.requestId !== 'string' || !uuid.test(input.requestId)) return null;
  return { feedbackId: input.feedbackId, value: input.value, requestId: input.requestId };
}

/** The public boundary is a projection, never a spread of a private database row. */
export function publicFeedback(input: unknown): PublicFeedback | null {
  if (!record(input) || !positiveId(input.id) || typeof input.message !== 'string' || input.message.length > 6000 || typeof input.created_at !== 'string' || !Number.isFinite(Date.parse(input.created_at))) return null;
  if (input.scope !== 'game' && input.scope !== 'site' || input.context !== 'result' && input.context !== 'game' && input.context !== 'site') return null;
  if (input.game_slug !== null && (typeof input.game_slug !== 'string' || !isGameSlug(input.game_slug))) return null;
  if (input.source !== 'player' && input.source !== 'reviewed' || !count(input.upvotes) || !count(input.downvotes) || input.vote !== -1 && input.vote !== 0 && input.vote !== 1) return null;
  if (input.own !== undefined && typeof input.own !== 'boolean') return null;
  return { id: input.id, message: input.message, scope: input.scope, context: input.context, gameSlug: input.game_slug, createdAt: input.created_at,
    source: input.source, upvotes: input.upvotes, downvotes: input.downvotes, score: input.upvotes - input.downvotes, vote: input.vote, own: input.own === true };
}
