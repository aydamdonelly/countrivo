"use client";

import type { OddOneOutState } from "@/lib/game-logic/odd-one-out/engine";
import { Button } from "@/ui/button";
import type { BoardProps } from "@/games/types";
import { AnswerOptions } from "@/games/_shared/option-list";
import { traitLine, type OddAction } from "./module";

/** Odd One Out (blueprint 8.8): four country tiles, an explicit next after the trait is shown. */
export function Board({ state, dispatch, busy }: BoardProps<OddOneOutState, OddAction>) {
  const round = state.rounds[state.currentRound];
  const feedback = state.phase === "feedback";
  const last = state.currentRound === state.rounds.length - 1;
  return (
    <div className="play-stack">
      <p className="play-center t-body play-line">Three share a trait. Which one doesn&apos;t?</p>
      <AnswerOptions
        options={round.countries.map((c) => ({ label: c.displayName, iso2: c.iso2 }))}
        chosen={state.answers[state.currentRound]}
        correctIndex={round.oddIndex}
        revealed={feedback}
        busy={busy}
        onPick={(i) => dispatch({ t: "answer", i })}
        grid="2"
        tile
      />
      {feedback ? (
        <>
          <p className="play-center t-body play-line">{traitLine(round.traitDescription)}</p>
          <div className="play-actions end">
            <Button variant="ink" onClick={() => dispatch({ t: "next" })} disabled={busy}>
              {last ? "See result" : "Next round"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
