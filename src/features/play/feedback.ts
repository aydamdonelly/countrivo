"use client";

import { juice } from "@/hooks/use-juice";
import type { Action, GameModule, TimedAction, VerdictInfo } from "@/games/types";

/** The juice for a verdict tone (blueprint 8.4): good correct, bad wrong, neutral select, milestone every fifth. */
export function juiceFor(v: VerdictInfo): void {
  if (v.milestone) juice.milestone();
  else if (v.tone === "good") juice.correct();
  else if (v.tone === "bad") juice.wrong();
  else juice.select();
}

/**
 * The timed follow-up for a state: the feedback window first (blueprint 8.5), else the
 * module's own `after`. Pure, so the host derives `busy` from it during render.
 */
export function planFor<S, A extends Action>(module: GameModule<S, A>, state: S): TimedAction<A> | null {
  const fb = module.feedback;
  if (fb && fb.inWindow(state)) return { ms: fb.ms, then: fb.advance, busy: true };
  return module.after ? module.after(state) : null;
}
