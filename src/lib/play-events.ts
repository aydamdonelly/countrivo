import { track } from "@vercel/analytics";

/**
 * The play funnel as Vercel Web Analytics custom events. Page views alone cannot tell a
 * visitor who opened a board from one who played it. The authoritative anonymous
 * daily history lives in countrivo_runs; these events describe the browser funnel.
 *
 * - `play_start`: the first move of a board (a resumed board counts again)
 * - `play_finish`: the board is done
 * - `run_saved`: the server confirmed a completed run
 * - `share`: the Share button was pressed
 *
 * Every event carries `game` (the slug) and `mode` (daily or practice), nothing else.
 */
export type PlayEvent = "play_start" | "play_finish" | "run_saved" | "share";

export function trackPlay(event: PlayEvent, game: string, mode: string): void {
  try {
    track(event, { game, mode });
  } catch {
    // Analytics never breaks a board.
  }
}

/** Retried commits and reopened results must not manufacture completed rounds. */
export function trackCompletedRun(game: string, mode: string, runId: number): void {
  try {
    const key = `cv_finished:${runId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch { /* The game still works with browser storage disabled. */ }
  trackPlay('play_finish', game, mode);
  trackPlay('run_saved', game, mode);
}

export function trackShareResult(outcome: 'native' | 'clipboard' | 'cancelled' | 'manual'): void {
  try {
    const game = window.location.pathname.match(/^\/games\/([a-z-]+)/)?.[1] ?? 'day';
    track('share_result', { game, outcome });
  } catch { /* Sharing never depends on analytics. */ }
}
