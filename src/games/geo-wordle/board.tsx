"use client";

import { useEffect, useState } from "react";
import { guessableCountries, resolveGuess, MAX_GUESSES } from "@/lib/game-logic/geo-wordle/engine";
import type { GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import { WorldMap } from "@/games/_shared/world-map";
import { kmLabel, type GeoAction } from "./module";

const INTRO = "A hidden country. Every guess tells you how far and which way.";

/** GeoWordle (blueprint 8.8): the map, the readout line, the field with Guess, six guess rows. */
export function Board({ state, dispatch, busy }: BoardProps<GeoWordleState, GeoAction>) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const live = state.phase === "playing";
  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError(null), 2000);
    return () => window.clearTimeout(id);
  }, [error]);

  const guessed = new Set(state.guesses.map((g) => g.iso3));
  const needle = text.trim().toLowerCase();
  const items: SuggestItem[] = needle
    ? guessableCountries()
        .filter((c) => !guessed.has(c.iso3) && (c.displayName.toLowerCase().includes(needle) || c.name.toLowerCase().includes(needle)))
        .slice(0, 5)
        .map((c) => ({ key: c.iso3, iso2: c.iso2, name: c.displayName }))
    : [];

  function submitIso3(iso3: string) {
    if (guessed.has(iso3)) {
      setError("Already guessed.");
      return;
    }
    dispatch({ t: "guess", iso3 });
    setText("");
  }
  function submitRaw(raw: string) {
    const c = resolveGuess(raw) ?? (items[0] ? guessableCountries().find((x) => x.iso3 === items[0].key) ?? null : null);
    if (!c) {
      setError("Not a country.");
      return;
    }
    submitIso3(c.iso3);
  }

  const last = state.guesses[state.guesses.length - 1];
  const readout = !last ? INTRO : last.correct ? `${last.name}. Solved in ${state.guesses.length}.` : `${last.name} is ${kmLabel(last.distanceKm)} ${last.direction} of the answer.`;
  return (
    <div className="play-stack">
      <WorldMap guesses={state.guesses} answerIso3={live ? null : state.answerIso3} />
      <p className="t-body play-line play-center">{readout}</p>
      {live ? (
        <div className="typed">
          <Suggest id="geo-guess" label="Country" hideLabel placeholder="Type a country" value={text} onChange={setText} items={items} onSelect={(it) => submitIso3(it.key)} onSubmit={submitRaw} max={5} error={error} disabled={busy} autoComplete="off" autoCapitalize="words" enterKeyHint="go" />
          <Button variant="ink" onClick={() => submitRaw(text)} disabled={busy || !text.trim()}>
            Guess
          </Button>
        </div>
      ) : null}
      <div className="grows t-row">
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const g = state.guesses[i];
          if (!g) {
            return (
              <div key={i} className="grow empty">
                <span className="t-meta">{i + 1}</span>
                <span className="dash" />
                <span />
                <span />
                <span />
              </div>
            );
          }
          return (
            <div key={g.iso3} className="grow">
              <Flag iso2={g.iso2} size="xs" alt="" />
              <span className="nm">{g.name}</span>
              <b className="km t-score num">{g.correct ? "Solved" : kmLabel(g.distanceKm)}</b>
              <span className="bar">
                <i className={`band-${g.band}`} style={{ transform: `scaleX(${Math.max(g.proximityPct, 3) / 100})` }} />
              </span>
              {g.correct ? (
                <CheckIcon size={16} className="ic-ok" />
              ) : (
                <svg className="needle" width="18" height="18" viewBox="0 0 24 24" aria-label={g.direction} role="img" style={{ transform: `rotate(${g.bearingDeg}deg)` }}>
                  <path d="M12 4l5 10-5-2.5L7 14z" fill="currentColor" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
