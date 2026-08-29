"use client";

import { useRef } from "react";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { AnswerOptions } from "@/games/_shared/option-list";
import type { QuizAction, QuizState } from "./module";

/** Flag Quiz (blueprint 8.8): the flag alone, four names, the 1200 ms reveal. */
export function Board({ state, dispatch, busy }: BoardProps<QuizState, QuizAction>) {
  const q = state.g.questions[state.g.currentQuestion];
  const first = useRef(state.g.currentQuestion);
  return (
    <div className="play-stack">
      <Subject key={state.g.currentQuestion} variant="flag-only" iso2={q.country.iso2} animate={state.g.currentQuestion !== first.current} />
      <AnswerOptions options={q.options.map((c) => ({ label: c.displayName }))} chosen={state.pending} correctIndex={q.correctIndex} revealed={state.pending !== null} busy={busy} onPick={(i) => dispatch({ t: "answer", i })} />
    </div>
  );
}
