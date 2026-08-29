"use client";

import { useState } from "react";
import { CountryBlock } from "@/games/_shared/country-block";
import { AnswerOptions } from "@/games/_shared/option-list";
import type { BoardProps } from "@/games/types";
import { currentQuestion, type CapitalAction, type CapitalState } from "./module";

/**
 * The Capital Match board (blueprint 8.8): the country at the top as the default Subject
 * (Flag l, its name in Erode, the mute line "What is the capital?"), then the four capitals
 * as full-width option rows. The flag is information here and the name sits beside it, so the
 * flag carries no alt text (blueprint 3.15).
 *
 * Everything is drawn from `state`: the pick, the revealed fills and the pips are all in the
 * first HTML, so a reload mid-run paints the resumed board with no effect and no jump. The
 * host holds `busy` for the 1200 ms reveal and the options carry their own revealed states.
 * `key` on the subject replays the reveal motion (6.3.1) on every new country, and the first
 * country of a session never animates, so nothing arrives moving.
 */
export function Board({ state, dispatch, busy }: BoardProps<CapitalState, CapitalAction>) {
  const [firstShown] = useState(state.g.currentQuestion);
  const q = currentQuestion(state);
  const revealed = state.pending !== null;

  return (
    <div className="play-stack">
      <CountryBlock
        key={state.g.currentQuestion}
        country={q.country}
        meta="What is the capital?"
        animate={state.g.currentQuestion !== firstShown}
      />
      <AnswerOptions
        options={q.options.map((capital) => ({ label: capital }))}
        chosen={state.pending}
        correctIndex={q.correctIndex}
        revealed={revealed}
        busy={busy}
        onPick={(i) => dispatch({ t: "answer", i })}
      />
    </div>
  );
}
