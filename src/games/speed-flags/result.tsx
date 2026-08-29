"use client";

import type { SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import type { ResultProps } from "@/games/types";
import { accuracy, SPEED_SECONDS } from "./module";

/**
 * The facts line (blueprint 8.8): accuracy and how many flags went by. The engine counts
 * answers, it does not keep which flag went which way, so there are no per-flag rows to
 * print and none are invented. The score itself is the panel's Erode number.
 */
export function Result({ state }: ResultProps<SpeedFlagsState>) {
  return (
    <p className="rhead t-body">
      <span className="rfacts">
        {state.total === 0 ? (
          `No flags called in ${SPEED_SECONDS} s.`
        ) : (
          <>
            <b>{accuracy(state)} %</b> accuracy · <b>{state.total}</b> in {SPEED_SECONDS} s
          </>
        )}
      </span>
    </p>
  );
}
