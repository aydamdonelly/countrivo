"use client";

import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import type { ResultProps } from "@/games/types";
import { accuracy, SPEED_SECONDS } from "./module";

/**
 * The facts line (blueprint 8.8): accuracy and attempts. The engine counts answers, it does
 * not keep which flag went which way, so there are no per-flag rows to print.
 */
export function Result({ state }: ResultProps<SpeedFlagsState>) {
  return (
    <p className="rhead t-body">
      <span className="rfacts">
        <b>{accuracy(state)} %</b> accuracy · <b>{state.total}</b> in {SPEED_SECONDS} s
      </span>
    </p>
  );
}
