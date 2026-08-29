import type { Action, GameModule } from "@/games/types";
import type { Mode } from "@/ui/types";

export interface Replayed<S, A extends Action> {
  state: S;
  /** The persisted actions the log decoded to (the host keeps appending to this list). */
  actions: A[];
}

/**
 * Rebuilds a board from its seed and its encoded log (blueprint 8.6), identically on the
 * server and the client, so the first HTML already shows the resumed board. A log the codec
 * rejects falls back to a fresh board. After every action that opens a feedback window the
 * window's `advance` is applied at once: a resumed board never waits on a timer.
 */
export function replay<S, A extends Action>(module: GameModule<S, A>, seed: number, mode: Mode, dateKey: string, log: string): Replayed<S, A> {
  let state = module.create(seed, mode, dateKey);
  if (!log) return { state, actions: [] };
  let actions: A[];
  try {
    actions = module.codec.dec(log);
  } catch {
    return { state, actions: [] };
  }
  const applied: A[] = [];
  for (const action of actions) {
    const next = module.reduce(state, action);
    if (next === state) continue;
    state = next;
    applied.push(action);
    if (module.feedback && module.feedback.inWindow(state)) {
      state = module.reduce(state, module.feedback.advance);
    }
  }
  return { state, actions: applied };
}

/** Practice reseed on "New board" (blueprint 8.2 rule 1): a 31-bit client seed. */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] >>> 1;
}
