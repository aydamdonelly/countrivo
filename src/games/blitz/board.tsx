"use client";

import { useEffect, useRef, useState } from "react";
import { checkAnswer, type BlitzState } from "@/lib/game-logic/blitz/engine";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import type { BlitzAction } from "./module";

/**
 * Blitz (blueprint 8.8): a flag, type the country, Enter. A miss shakes the field and rings
 * it in ember for 500 ms; the name shows under the flag while the round turns over. The field
 * stays in place through both, so nothing jumps.
 */
export function Board({ state, dispatch, busy }: BoardProps<BlitzState, BlitzAction>) {
  const [text, setText] = useState("");
  const [wrong, setWrong] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  const round = state.rounds[Math.min(state.currentRound, state.rounds.length - 1)];
  const between = state.phase === "between";

  // A new round: stamp the clock the answer is measured against and take the caret.
  useEffect(() => {
    shownAt.current = Date.now();
    if (state.phase === "playing") input.current?.focus();
  }, [state.currentRound, state.phase]);

  // The ember ring on a miss lasts 500 ms (blueprint 8.8).
  useEffect(() => {
    if (!wrong) return;
    const id = window.setTimeout(() => setWrong(false), 500);
    return () => window.clearTimeout(id);
  }, [wrong]);

  function submit() {
    const raw = text.trim();
    if (!raw || between || busy) return;
    setWrong(!checkAnswer(raw, round.country));
    dispatch({ t: "answer", text: raw, ms: Date.now() - shownAt.current });
    setText("");
  }

  return (
    <div className="play-stack">
      <Subject key={state.currentRound} variant="flag-only" iso2={round.country.iso2} animate={state.currentRound > 0} />
      <p className={between && !round.correct ? "reveal-name bad t-list" : "reveal-name t-list"}>{between ? round.country.displayName : ""}</p>
      <form
        className="typed"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field
          id="blitz-answer"
          label="Country"
          hideLabel
          ref={input}
          placeholder="Type the country"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          emberRing={wrong}
          tall
          disabled={busy || between}
        />
        <Button type="submit" variant="ink" disabled={busy || between || !text.trim()}>
          Enter
        </Button>
      </form>
    </div>
  );
}
