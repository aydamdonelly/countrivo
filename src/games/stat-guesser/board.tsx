"use client";

import { useState, type FormEvent } from "react";
import { formatStat } from "@/lib/utils";
import type { StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Flag } from "@/ui/flag";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import { parseHumanNumber } from "@/games/_shared/format";
import { errorTone, type GuesserAction } from "./module";
import { statLabel } from "@/games/_shared/format";

/** Stat Guesser (blueprint 8.8): the stat, the reference line, the target, a decimal field; then the two lines and Next round. */
export function Board({ state, dispatch, busy }: BoardProps<StatGuesserState, GuesserAction>) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const round = state.rounds[state.currentRound];
  const [first] = useState(state.currentRound);
  const unit = round.category.unit;
  const feedback = state.phase === "feedback";
  const last = state.currentRound === state.rounds.length - 1;

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = parseHumanNumber(text);
    if (v === null) {
      setError("Enter a number like 1.5M, 200K or 3B");
      return;
    }
    setError(null);
    setText("");
    dispatch({ t: "guess", v });
  }

  const e = state.scores[state.currentRound] ?? 0;
  return (
    <div className="play-stack">
      <Subject variant="stat" slug={round.category.slug} label={statLabel(round.category.slug, round.category.label)} clarifier={round.category.clarifier} />
      <p className="t-body play-line play-center">
        <Flag iso2={round.anchor.country.iso2} size="xs" alt="" /> For reference: <b>{round.anchor.country.displayName}</b> {formatStat(round.anchor.value, unit)}
      </p>
      <CountryBlock key={state.currentRound} country={round.country} animate={state.currentRound !== first} alt={round.country.displayName} />
      {feedback ? (
        <>
          <div className="guess-lines">
            <span>
              <span className="lbl t-meta">your guess</span>
              <b className="t-score-l num">{formatStat(state.guesses[state.currentRound] ?? 0, unit)}</b>
            </span>
            <span>
              <span className="lbl t-meta">actual</span>
              <b className="t-score-l num">{formatStat(round.actualValue, unit)}</b>
            </span>
          </div>
          <p className={`play-center t-body verdict ${errorTone(e)}`} style={{ marginTop: 0 }}>
            {e} % off
          </p>
          <div className="play-actions">
            <Button variant="ink" onClick={() => dispatch({ t: "next" })} disabled={busy}>
              {last ? "See result" : "Next round"}
            </Button>
          </div>
        </>
      ) : (
        <form className="typed" onSubmit={submit}>
          <Field id="stat-guess" label="Your guess" hideLabel placeholder="e.g. 1.5M, 200K, 3B" inputMode="decimal" autoComplete="off" enterKeyHint="go" value={text} onChange={(ev) => setText(ev.target.value)} error={error} disabled={busy} tall />
          <Button type="submit" variant="ink" disabled={busy || !text.trim()}>
            Submit
          </Button>
        </form>
      )}
    </div>
  );
}
