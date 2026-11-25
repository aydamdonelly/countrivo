import { recordUsageBatch } from '@/app/actions/usage';
import { usageRoute, validateUsageBatch, type UsageEvent, type UsageEventName, type UsageProperties, type UsageSource } from './usage';

const STORAGE = 'cv_usage_queue';
let queue: UsageEvent[] = [];
let loaded = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let sending = false;
let paused = false;
let lastInteraction = 0;

function persist() {
  try { sessionStorage.setItem(STORAGE, JSON.stringify(queue)); } catch { /* Storage is optional. */ }
}
function restore() {
  if (loaded) return;
  loaded = true;
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE) ?? '[]');
    if (Array.isArray(stored)) for (let i = 0; i < Math.min(stored.length, 192); i += 32) queue.push(...(validateUsageBatch(stored.slice(i, i + 32)) ?? []));
  } catch { /* A fresh queue is sufficient. */ }
}
function schedule() {
  if (!paused && !timer && queue.length) timer = setTimeout(() => { timer = undefined; void flush(); }, 5000);
}
function liveGame() {
  return /\/games\/[^/]+\/play/.test(location.pathname) && !document.querySelector('.rp,.dr-result-card,.gw-result');
}
async function flush() {
  if (paused || sending || !queue.length) return;
  // Server actions share a client queue. Send only after interaction has settled,
  // never in front of an active board move or while the player is typing.
  if (document.visibilityState !== 'visible' || !navigator.onLine || liveGame() || Date.now() - lastInteraction < 5000 || document.activeElement?.matches('input,textarea,select') || document.querySelector('[aria-busy="true"]')) { schedule(); return; }
  sending = true;
  const batch = queue.slice(0, 32);
  try {
    if (await recordUsageBatch(batch)) {
      const ids = new Set(batch.map(event => event.id));
      queue = queue.filter(event => !ids.has(event.id));
      persist();
    }
  } catch { /* Retry the same IDs; gameplay never depends on this response. */ }
  finally { sending = false; schedule(); }
}

export function deferUsage(): void { lastInteraction = Date.now(); }
export function resumeUsage(): void { restore(); schedule(); }
export function forgetUsage(): void {
  paused = true;
  queue = [];
  if (timer) clearTimeout(timer);
  timer = undefined;
  try { sessionStorage.removeItem(STORAGE); } catch { /* Storage is optional. */ }
}
export function trackUsage(event: UsageEventName, properties: UsageProperties = {}): void {
  if (paused || typeof window === 'undefined' || location.pathname.startsWith('/admin')) return;
  try {
    restore();
    const context = usageRoute(location.href, location.origin);
    const input = validateUsageBatch([{ id: crypto.randomUUID(), event, game: context.game, mode: context.mode, action: context.action, ...properties }]);
    if (!input) return;
    queue.push(...input);
    if (queue.length > 192) queue = queue.slice(-192);
    persist();
    deferUsage();
    schedule();
  } catch { /* A blocked browser store never breaks an interaction. */ }
}

export function trackNavigation(href: string, source: UsageSource = 'other'): void {
  const current = usageRoute(location.href, location.origin);
  const destination = usageRoute(href, location.origin);
  const properties: UsageProperties = { source, target: destination.target, targetGame: destination.game,
    ...(current.action === 'challenge' || destination.action === 'challenge' ? { action: 'challenge' } : {}) };
  trackUsage('navigation', properties);
  if (destination.target === 'leaderboard') trackUsage('leaderboard_open', properties);
  if (current.game && destination.game && current.game !== destination.game) trackUsage('game_switch', properties);
}
