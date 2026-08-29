"use client";

import { useState } from "react";
import { Options, OptionButton } from "@/ui/options";
import { Subject } from "@/ui/subject";
import { optionState } from "@/games/_shared/option-list";
import type { BoardProps } from "@/games/types";
import { currentQuestion, type QuizAction, type QuizState } from "./module";

/**
 * The Flag Quiz board (blueprint 8.8): the flag alone at 120x90 with no name and no alt text
 * (naming it would give the answer away), then the four country names as options. Full-width
 * rows on the phone, the 2x2 the desktop play column asks for at 1024 (blueprint 7.5).
 *
 * Everything is drawn from `state`: the pick, the revealed fills and the pips are all in the
 * first HTML, so a reload mid-run paints the resumed board with no effect and no jump. The
 * host holds `busy` for the 1200 ms reveal window and the options carry their revealed
 * states; `key` on the subject replays the reveal motion (6.3.1) on every new flag, and the
 * first flag of a session never animates, so nothing arrives moving.
 */
export function Board({ state, dispatch, busy }: BoardProps<QuizState, QuizAction>) {
  const [firstShown] = useState(state.g.currentQuestion);
  const q = currentQuestion(state);
  const revealed = state.pending !== null;

  return (
    <div className="play-stack">
      <Subject key={state.g.currentQuestion} variant="flag-only" iso2={q.country.iso2} animate={state.g.currentQuestion !== firstShown} />
      <Options busy={busy || revealed} className="lg:grid lg:grid-cols-2">
        {q.options.map((c, i) => (
          <OptionButton
            key={c.iso3}
            label={c.displayName}
            keyHint={String(i + 1)}
            state={optionState(i, state.pending, q.correctIndex, revealed)}
            disabled={revealed}
            onClick={() => dispatch({ t: "answer", i })}
          />
        ))}
      </Options>
    </div>
  );
}
