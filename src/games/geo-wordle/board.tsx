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
import { REJECTED, kmLabel, type GeoAction } from "./module";

const INTRO = "A hidden country. Every guess tells you how far and which way.";

/*
 * Everything this board needs on top of the shared play furniture, in one place. Three
 * decisions worth their comment:
 *
 * 1. The row grid (blueprint 8.8): flag, name, distance, the 3 px proximity bar, the needle.
 *    The shared rule sizes the bar column at 64, which leaves 150 px for the name and clips
 *    ten of the 237 country names on a 390 px phone; 48 gives the name 162 and only the three
 *    longest ("Saint Vincent and the Grenadines" and its kin) still end in an ellipsis.
 *
 * 2. The proximity ramp. Blueprint 1 cuts the six bands out of the grey ramp starting at
 *    `line`, which is the value of the bar's own track: a cold guess would draw an invisible
 *    bar, and cold is exactly the guess a player most needs to read. The two coldest bands
 *    move one step down the same ramp (cold `wait`, cool `faint`) so all six clear the track
 *    and still darken monotonically towards the answer. Warm, hot, burning and hit are
 *    untouched.
 *
 * 3. The map dots. The same ramp cannot run on the map, whose backdrop of 237 centroids is
 *    itself `wait`: a cold or cool guess would sit lighter than the world behind it. On a map
 *    the dot's position already IS its distance, so the guesses take one tone, ink, and the
 *    answer takes ember when it is revealed. The band ramp lives in the bars, where it reads.
 *
 * The two keyframes animate out of the element's own final transform (blueprint 6.3.8), so a
 * board with animation off (reduced motion, a screenshot pass, no JS at all) still shows
 * every bar at its true length and every needle on its true bearing.
 */
const STYLE = `
.geo .grow { grid-template-columns: 26px minmax(0, 1fr) 62px 48px 20px; }
.geo .grow .bar { background: var(--color-card); }
.geo .grow.empty .dash { border-radius: 1px; }
.geo .grow > :last-child { justify-self: center; }
.geo .band-cold { background: var(--color-wait); }
.geo .band-cool { background: var(--color-faint); }
.geo-map .dot-cold, .geo-map .dot-cool, .geo-map .dot-warm, .geo-map .dot-hot, .geo-map .dot-burning { fill: var(--color-ink); }
.geo-map .dot-hit { fill: var(--color-ember); }
.geo .grow .bar i { animation: geo-bar 240ms var(--ease-out); }
.geo .grow .needle { animation: geo-needle 300ms var(--ease-out); }
@keyframes geo-bar { from { transform: scaleX(0); } }
@keyframes geo-needle { from { transform: rotate(0deg); } }
@media (prefers-reduced-motion: reduce) {
  .geo .grow .bar i, .geo .grow .needle { animation: none; }
}
`;

/** Accents folded, so `curacao` finds Curaçao and `sao tome` finds São Tomé and Príncipe. */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
    /** Every word start, so `guinea` finds Papua New Guinea and `verde` finds Cape Verde. */
    words: [...new Set(keys.flatMap((k) => k.split(/[^a-z0-9]+/).filter(Boolean)))],
  };
});

/**
 * The needle: one ink dart, drawn with a notched tail so the direction reads at 20 px and at
 * any rotation (a two-tone lens turns into a bowtie the moment it is small, and a bare
 * triangle loses its tail). The bearing is rounded to a whole degree because the browser
 * re-serialises a long one and hydration would then read the server's string as a mismatch.
 */
function Needle({ deg, label }: { deg: number; label: string }) {
  return (
    <svg
      className="needle"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      style={{ transform: `rotate(${Math.round(deg)}deg)` }}
    >
      <path d="M12 3 17 21 12 17 7 21Z" fill="currentColor" />
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

  function focusField(): void {
    fieldWrap.current?.querySelector("input")?.focus();
  }

  /*
   * A word the engine cannot use. The message sits under the field where it was typed, and
   * the refusal still goes to the host: it leaves the state untouched (nothing is logged, no
   * guess is spent) but it carries the wrong sound and clears a verdict that belongs to an
   * older guess (blueprint 8.8: the two errors juice wrong).
   */
  function reject(message: string): void {
    errorSeq.current += 1;
    setError({ id: errorSeq.current, text: message });
    dispatch(REJECTED);
    focusField();
  }

  const guessed = useMemo(() => new Set(state.guesses.map((g) => g.iso3)), [state.guesses]);
  /*
   * `bearingDeg` comes out of Math.atan2, whose last bits are implementation-defined, so Node
   * and the browser disagree on the sixteenth digit. Rounding to a whole degree before it
   * reaches any attribute keeps the server HTML and the hydrated tree identical.
   */
  const mapGuesses = useMemo<MapGuess[]>(
    () =>
      state.guesses.map((g) => ({
        iso3: g.iso3,
        band: g.band,
        bearingDeg: Math.round(g.bearingDeg),
        correct: g.correct,
      })),
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
      reject("Already guessed.");
      return;
    }
    setText("");
    setError(null);
    dispatch({ t: "guess", iso3 });
    focusField();
  }

  function guessTyped(raw: string): void {
    const typed = raw.trim();
    if (!typed) {
      focusField();
      return;
    }
    // The button does what Enter does: an exact name, else the top suggestion.
    const iso3 = resolveGuess(typed)?.iso3 ?? items[0]?.key;
    if (!iso3) {
      reject("Not a country.");
      return;
    }
    guess(iso3);
  }

  const last = state.guesses.length ? state.guesses[state.guesses.length - 1] : null;

  return (
    <div className="play-stack geo">
      <style href="geo-wordle" precedence="default">
        {STYLE}
      </style>
      <WorldMap className="geo-map" guesses={mapGuesses} answerIso3={live ? null : state.answerIso3} />
      <p className="t-body play-line" style={{ minHeight: "2.9em" }} aria-live="polite">
        {!last ? (
          INTRO
        ) : state.phase === "won" ? (
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
        <div className="typed" ref={fieldWrap}>
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
      <div className="grows t-row">
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const g = state.guesses[i];
          if (!g) {
            return (
              <div key={`open-${i}`} className="grow empty">
                <span className="t-num num">{i + 1}</span>
                <span className="dash" />
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
              <span className="bar" aria-hidden="true">
                <i className={`band-${g.band}`} style={{ transform: `scaleX(${Math.max(g.proximityPct, 3) / 100})` }} />
              </span>
              {g.correct ? (
                <CheckIcon size={18} className="ic-ok" />
              ) : (
                <Needle deg={g.bearingDeg} label={`${g.direction} of the answer`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
