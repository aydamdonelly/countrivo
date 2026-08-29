"use client";

import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { AnswerOptions } from "@/games/_shared/option-list";
import type { ExampleAction, ExampleState } from "./module";

/**
 * The reference board: renders everything from `state` (nothing waits on an effect), takes
 * `busy` from the host during the feedback window, and dispatches small serialisable actions.
 */
export function Board({ state, dispatch, busy }: BoardProps<ExampleState, ExampleAction>) {
  const round = state.rounds[state.current];
  return (
    <div className="play-stack">
      <Subject key={state.current} variant="flag-only" iso2={round.country.iso2} animate={state.current > 0} />
      <AnswerOptions
        options={round.options.map((c) => ({ label: c.displayName }))}
        chosen={state.pending}
        correctIndex={round.correctIndex}
        revealed={state.pending !== null}
        busy={busy}
        onPick={(i) => dispatch({ t: "answer", i })}
      />
    </div>
  );
}
