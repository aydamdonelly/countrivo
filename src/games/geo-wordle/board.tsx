"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  guessableCountries,
  resolveGuess,
  MAX_GUESSES,
  type GeoWordleState,
} from "@/lib/game-logic/geo-wordle/engine";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import { WorldMap, type MapGuess } from "@/games/_shared/world-map";
import { kmLabel, type GeoAction } from "./module";

const INTRO = "A hidden country. Every guess tells you how far and which way.";

/*
 * The map is the wide subject; the field and the six rows sit in a narrower column under it,
 * centred. Without the cap a 720 px play column strands the country name at one rim and the
 * distance at the other with a hand's width of nothing between them.
 */
const COLUMN = { width: "100%", maxWidth: 520, marginLeft: "auto", marginRight: "auto" } as const;

/** Accents folded, so `cote` finds Côte d'Ivoire and `sao` finds São Tomé. */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** The 237 countries with a centroid, folded once at module load. */
const POOL = guessableCountries().map((c) => {
  const keys = [fold(c.displayName), fold(c.name)];
  return {
    iso3: c.iso3,
    iso2: c.iso2,
    name: c.displayName,
    keys,
    /** Every word start, so `ivoire` finds Cote d'Ivoire and `guinea` finds Papua New Guinea. */
    words: [...new Set(keys.flatMap((k) => k.split(/[^a-z0-9]+/).filter(Boolean)))],
  };
});

/**
 * The compass needle: a solid ink head and a wait-coloured tail meeting on a paper pivot,
 * point-symmetric about the box centre so it turns cleanly around its own axis. The bearing
 * is rounded to a whole degree because the browser re-serialises a long one and hydration
 * would then read the server string as a mismatch.
 */
function Needle({ deg, label }: { deg: number; label: string }) {
  return (
    <svg
      className="needle"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      style={{ transform: `rotate(${Math.round(deg)}deg)` }}
    >
      <path d="M12 3.6 15.2 12.8 12 11.2 8.8 12.8Z" fill="currentColor" />
      <path d="M12 20.4 8.8 11.2 12 12.8 15.2 11.2Z" fill="var(--color-wait)" />
      <circle cx="12" cy="12" r="1.5" fill="var(--color-paper)" />
    </svg>
  );
}

/**
 * GeoWordle (blueprint 8.8): the map, the readout line, the field with Guess, six guess
 * rows. Everything renders from `state`, so a resumed board is complete in the first HTML.
 */
export function Board({ state, dispatch, busy }: BoardProps<GeoWordleState, GeoAction>) {
  const [text, setText] = useState("");
  const [error, setError] = useState<{ id: number; text: string } | null>(null);
  const errorSeq = useRef(0);
  const fieldWrap = useRef<HTMLDivElement>(null);
  const live = state.phase === "playing";

  // The error under the field clears itself after two seconds (blueprint 8.8).
  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError((e) => (e && e.id === error.id ? null : e)), 2000);
    return () => window.clearTimeout(id);
  }, [error]);

  function fail(message: string): void {
    errorSeq.current += 1;
    setError({ id: errorSeq.current, text: message });
  }

  const guessed = useMemo(() => new Set(state.guesses.map((g) => g.iso3)), [state.guesses]);
  /*
   * `bearingDeg` comes out of Math.atan2, whose last bits are implementation-defined, so
   * Node and the browser disagree on the sixteenth digit. Rounding to a whole degree before
   * it reaches any attribute keeps the server HTML and the hydrated tree identical.
   */
  const mapGuesses = useMemo<MapGuess[]>(
    () => state.guesses.map((g) => ({ iso3: g.iso3, band: g.band, bearingDeg: Math.round(g.bearingDeg), correct: g.correct })),
    [state.guesses],
  );
  const needle = fold(text.trim());
  const items: SuggestItem[] = useMemo(() => {
    if (!needle) return [];
    const lead: SuggestItem[] = [];
    const word: SuggestItem[] = [];
    const inside: SuggestItem[] = [];
    for (const c of POOL) {
      if (guessed.has(c.iso3)) continue;
      const item = { key: c.iso3, iso2: c.iso2, name: c.name };
      if (c.keys.some((k) => k.startsWith(needle))) lead.push(item);
      else if (c.words.some((w) => w.startsWith(needle))) word.push(item);
      else if (c.keys.some((k) => k.includes(needle))) inside.push(item);
      if (lead.length >= 5) break;
    }
    // A match inside a word (`stan`) only fills the list when nothing starts with the input.
    const ranked = lead.length + word.length > 0 ? [...lead, ...word] : inside;
    return ranked.slice(0, 5);
  }, [needle, guessed]);

  function guess(iso3: string): void {
    if (guessed.has(iso3)) {
      fail("Already guessed.");
      return;
    }
    setText("");
    setError(null);
    dispatch({ t: "guess", iso3 });
    fieldWrap.current?.querySelector("input")?.focus();
  }

  function guessTyped(raw: string): void {
    const typed = raw.trim();
    if (!typed) {
      fieldWrap.current?.querySelector("input")?.focus();
      return;
    }
    // The button does what Enter does: an exact name, else the top suggestion.
    const iso3 = resolveGuess(typed)?.iso3 ?? items[0]?.key;
    if (!iso3) {
      fail("Not a country.");
      return;
    }
    guess(iso3);
  }

  const last = state.guesses.length ? state.guesses[state.guesses.length - 1] : null;

  return (
    <div className="play-stack">
      <WorldMap guesses={mapGuesses} answerIso3={live ? null : state.answerIso3} />
      <p className="t-body play-line play-center" style={{ minHeight: "2.9em" }}>
        {!last ? (
          INTRO
        ) : last.correct ? (
          <>
            <b>{last.name}</b>. Solved in {state.guesses.length}.
          </>
        ) : (
          <>
            {last.name} is <b>{kmLabel(last.distanceKm)}</b> {last.direction} of the answer.
          </>
        )}
      </p>
      {live ? (
        <div className="typed" ref={fieldWrap} style={COLUMN}>
          <Suggest
            id="geo-guess"
            label="Country"
            hideLabel
            placeholder="Type a country"
            value={text}
            onChange={(v) => {
              setText(v);
              setError(null);
            }}
            items={items}
            onSelect={(item) => guess(item.key)}
            onSubmit={guessTyped}
            max={5}
            error={error?.text ?? null}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="go"
          />
          <Button variant="ink" onClick={() => guessTyped(text)} disabled={busy}>
            Guess
          </Button>
        </div>
      ) : null}
      <div className="grows t-row" style={COLUMN}>
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const g = state.guesses[i];
          if (!g) {
            return (
              <div key={`open-${i}`} className="grow empty">
                <span className="t-num num">{i + 1}</span>
                <span className="dash" style={{ borderRadius: "1px" }} />
              </div>
            );
          }
          return (
            <div key={g.iso3} className="grow">
              <Flag iso2={g.iso2} size="xs" alt="" eager />
              <span className="nm">{g.name}</span>
              {g.correct ? (
                <span className="km t-body">Solved</span>
              ) : (
                <b className="km t-score num">{kmLabel(g.distanceKm)}</b>
              )}
              <span className="bar" style={{ background: "var(--color-card)" }} aria-hidden="true">
                <i
                  className={`band-${g.band}`}
                  style={{ transform: `scaleX(${Math.max(g.proximityPct, 3) / 100})` }}
                />
              </span>
              {g.correct ? <CheckIcon size={16} className="ic-ok" /> : <Needle deg={g.bearingDeg} label={g.direction} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
