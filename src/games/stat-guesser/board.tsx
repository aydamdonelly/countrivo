"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { formatStat } from "@/lib/utils";
import type { StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Flag } from "@/ui/flag";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { statLabel, parseHumanNumber } from "@/games/_shared/format";
import { errorText, errorTone, type ErrorTone, type GuesserAction } from "./module";

/** The error line takes the tone of the read: ink under 20, mute under 50, ember otherwise. */
const TONE: Record<ErrorTone, CSSProperties> = {
  good: { color: "var(--color-ink)", fontWeight: 600 },
  neutral: { color: "var(--color-mute)", fontWeight: 500 },
  bad: { color: "var(--color-ember)", fontWeight: 600 },
};

const REFERENCE: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" };

/**
 * Stat Guesser (blueprint 8.8): the stat, one country you know as a reference, then the
 * country you have to price. Type a number, read how far off you were, take the next round.
 * Everything renders from `state`: a resumed board arrives on the round it left.
 */
export function Board({ state, dispatch, busy }: BoardProps<StatGuesserState, GuesserAction>) {
  const round = state.rounds[state.currentRound];
  const feedback = state.phase === "feedback";
  const last = state.currentRound === state.rounds.length - 1;
  const unit = round.category.unit;
  const error = state.scores[state.currentRound] ?? 0;

  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [openedOn] = useState(state.currentRound);
  const field = useRef<HTMLInputElement>(null);
  const wasFeedback = useRef(feedback);

  // The field takes focus again when a round opens, so Enter carries from round to round.
  // Never on arrival: a board must not pull the page or the keyboard around on load.
  useEffect(() => {
    if (wasFeedback.current && !feedback) field.current?.focus();
    wasFeedback.current = feedback;
  }, [feedback]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = parseHumanNumber(text);
    if (value === null) {
      setInvalid("Enter a number like 1.5M, 200K or 3B.");
      return;
    }
    setInvalid(null);
    setText("");
    dispatch({ t: "guess", v: value });
  }

  return (
    <div className="play-stack">
      <Subject
        key={`s${state.currentRound}`}
        variant="stat"
        slug={round.category.slug}
        label={statLabel(round.category.slug, round.category.label)}
        clarifier={round.category.clarifier}
        animate={state.currentRound !== openedOn}
      />
      <p className="t-body play-line" style={REFERENCE}>
        <Flag iso2={round.anchor.country.iso2} size="xs" alt="" />
        <span>
          For reference: <b>{round.anchor.country.displayName}</b> {formatStat(round.anchor.value, unit)}
        </span>
      </p>
      <Subject key={`c${state.currentRound}`} iso2={round.country.iso2} name={round.country.displayName} animate={state.currentRound !== openedOn} />
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
          <p className="t-body play-center" style={TONE[errorTone(error)]}>
            <span className="num">{errorText(error)}</span> % off
          </p>
          {/* the advance sits where Submit sat, on the same right edge, so nothing jumps */}
          <div className="play-actions end">
            <Button variant="ink" onClick={() => dispatch({ t: "next" })} disabled={busy}>
              {last ? "See result" : "Next round"}
            </Button>
          </div>
        </>
      ) : (
        <form className="typed" onSubmit={submit} noValidate>
          <Field
            id="stat-guess"
            ref={field}
            label="Your guess"
            hideLabel
            placeholder="e.g. 1.5M, 200K, 3B"
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={16}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (invalid) setInvalid(null);
            }}
            error={invalid}
            disabled={busy}
            tall
          />
          <Button type="submit" variant="ink" disabled={busy || text.trim() === ""}>
            Submit
          </Button>
        </form>
      )}
    </div>
  );
}
