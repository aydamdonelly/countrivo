import { track } from "@vercel/analytics";

/**
 * The play funnel as Vercel Web Analytics custom events. Page views alone cannot tell a
 * visitor who opened a board from one who played it, and only signed-in runs reach
 * `game_runs`, so these four are the only record of anonymous play.
 *
 * - `play_start`: the first move of a board (a resumed board counts again)
 * - `play_finish`: the board is done
 * - `run_saved`: the run reached `game_runs` (signed in, or joined as a guest)
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
