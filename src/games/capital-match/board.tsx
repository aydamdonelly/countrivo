"use client";

import { useState } from "react";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import { AnswerOptions } from "@/games/_shared/option-list";
import type { CapitalAction, CapitalState } from "./module";

/** Capital Match (blueprint 8.8): the country, "What is the capital?", four capitals. */
export function Board({ state, dispatch, busy }: BoardProps<CapitalState, CapitalAction>) {
  const q = state.g.questions[state.g.currentQuestion];
  const [first] = useState(state.g.currentQuestion);
  return (
    <div className="play-stack">
      <CountryBlock key={state.g.currentQuestion} country={q.country} meta="What is the capital?" animate={state.g.currentQuestion !== first} alt={q.country.displayName} />
      <AnswerOptions options={q.options.map((label) => ({ label }))} chosen={state.pending} correctIndex={q.correctIndex} revealed={state.pending !== null} busy={busy} onPick={(i) => dispatch({ t: "answer", i })} />
    </div>
  );
}
