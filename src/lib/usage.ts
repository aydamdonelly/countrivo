import { isRecordedGameSlug, type GameSlug } from '@/ui/types';

export const USAGE_EVENTS = ['page_view', 'navigation', 'game_switch', 'leaderboard_open', 'entry_manage', 'entry_action', 'disclosure', 'game_control', 'share_intent', 'share_result', 'feedback_open', 'feedback_submit', 'feedback_result', 'feedback_close'] as const;
export type UsageEventName = typeof USAGE_EVENTS[number];
export const USAGE_SOURCES = ['header', 'game', 'result', 'home', 'footer', 'leaderboard', 'other'] as const;
export type UsageSource = typeof USAGE_SOURCES[number];
export const USAGE_TARGETS = ['home', 'play', 'game', 'leaderboard', 'practice', 'archive', 'world', 'countries', 'stats', 'lists', 'support', 'about', 'legal', 'feedback', 'other'] as const;
export type UsageTarget = typeof USAGE_TARGETS[number];
export const USAGE_OUTCOMES = ['native', 'clipboard', 'cancelled', 'manual', 'saved', 'invalid', 'rate_limited', 'unavailable', 'closed', 'opened'] as const;
export type UsageOutcome = typeof USAGE_OUTCOMES[number];
export const USAGE_ACTIONS = ['day', 'result', 'challenge', 'game', 'site', 'save_name', 'change_name', 'restore_guest', 'cancel', 'country_flag', 'score_details', 'run_details', 'history', 'week', 'yesterday', 'world', 'hint', 'bonus', 'replay', 'next', 'retry', 'statistics'] as const;
export type UsageAction = typeof USAGE_ACTIONS[number];

export interface UsageProperties {
  game?: GameSlug;
  mode?: 'daily' | 'practice';
  source?: UsageSource;
  target?: UsageTarget;
  targetGame?: GameSlug;
  outcome?: UsageOutcome;
  action?: UsageAction;
}
export interface UsageEvent extends UsageProperties {
  id: string;
  event: UsageEventName;
}

function member<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.some(item => item === value);
}

/** Only allowlisted categorical values cross the analytics boundary. */
export function validateUsageBatch(input: unknown): UsageEvent[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 32) return null;
  const valid: UsageEvent[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) || !('event' in item) || !member(item.event, USAGE_EVENTS)) return null;
    const event: UsageEvent = { id: item.id, event: item.event };
    if ('game' in item && item.game !== undefined) { if (typeof item.game !== 'string' || !isRecordedGameSlug(item.game)) return null; event.game = item.game; }
    if ('targetGame' in item && item.targetGame !== undefined) { if (typeof item.targetGame !== 'string' || !isRecordedGameSlug(item.targetGame)) return null; event.targetGame = item.targetGame; }
    if ('mode' in item && item.mode !== undefined) { if (item.mode !== 'daily' && item.mode !== 'practice') return null; event.mode = item.mode; }
    if ('source' in item && item.source !== undefined) { if (!member(item.source, USAGE_SOURCES)) return null; event.source = item.source; }
    if ('target' in item && item.target !== undefined) { if (!member(item.target, USAGE_TARGETS)) return null; event.target = item.target; }
    if ('outcome' in item && item.outcome !== undefined) { if (!member(item.outcome, USAGE_OUTCOMES)) return null; event.outcome = item.outcome; }
    if ('action' in item && item.action !== undefined) { if (!member(item.action, USAGE_ACTIONS)) return null; event.action = item.action; }
    valid.push(event);
  }
  return valid;
}

export function usageRoute(href: string, base = 'https://countrivo.com'): UsageProperties {
  try {
    const url = new URL(href, base);
    if (url.origin !== new URL(base).origin) return { target: 'other' };
    const parts = url.pathname.split('/').filter(Boolean);
    const game = parts[0] === 'games' && isRecordedGameSlug(parts[1] ?? '') ? parts[1] : undefined;
    const target: UsageTarget = !parts.length ? 'home' : parts[0] === 'games' ? parts[2] === 'play' ? 'play' : parts[2] === 'leaderboard' ? 'leaderboard' : 'game'
      : parts[0] === 'leaderboard' ? 'leaderboard' : parts[0] === 'practice' ? 'practice' : parts[0] === 'archive' ? 'archive'
      : parts[0] === 'world' ? 'world' : parts[0] === 'countries' ? 'countries' : parts[0] === 'categories' ? 'stats'
      : parts[0] === 'lists' ? 'lists' : parts[0] === 'support' ? 'support' : parts[0] === 'about' ? 'about' : parts[0] === 'feedback' ? 'feedback'
      : ['privacy', 'terms', 'imprint', 'sources', 'credits'].includes(parts[0]) ? 'legal' : 'other';
    return { target, ...(game && isRecordedGameSlug(game) ? { game } : {}), ...(target === 'play' ? { mode: url.searchParams.get('mode') === 'practice' ? 'practice' as const : 'daily' as const } : {}), ...(parts[0] === 'challenge' || url.searchParams.has('challenge') ? { action: 'challenge' as const } : {}) };
  } catch { return { target: 'other' }; }
}
