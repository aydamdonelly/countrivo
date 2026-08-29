"use client";

import { useState } from "react";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { AnswerOptions } from "@/games/_shared/option-list";
import type { StreakAction, StreakState } from "./module";

/** Country Streak (blueprint 8.8): the flag, "Which country is this?", four names, an 800 ms window. */
export function Board({ state, dispatch, busy }: BoardProps<StreakState, StreakAction>) {
  const g = state.g;
  const country = g.queue[g.currentIndex];
  const [first] = useState(g.currentIndex);
  return (
    <div className="play-stack">
      <Subject key={g.currentIndex} variant="flag-only" iso2={country.iso2} animate={g.currentIndex !== first} />
      <p className="play-center t-body play-line">Which country is this?</p>
      <AnswerOptions options={g.options.map((c) => ({ label: c.displayName }))} chosen={state.pending} correctIndex={g.correctIndex} revealed={state.pending !== null} busy={busy} onPick={(i) => dispatch({ t: "answer", i })} />
    </div>
  );
}
