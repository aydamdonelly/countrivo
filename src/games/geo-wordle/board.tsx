"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  resolveGuess,
  MAX_GUESSES,
  type GeoWordleState,
} from "@/lib/game-logic/geo-wordle/engine";
import { suggestCountries } from "@/lib/game-logic/geo-wordle/input";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import type { BoardProps } from "@/games/types";
import { WorldMap, type MapGuess } from "@/games/_shared/world-map";
import { REJECTED, kmLabel, type GeoAction } from "./module";

const INTRO = "Six guesses. Distance and arrows guide you to the hidden country.";

/*
 * Everything this board needs on top of the shared play furniture, in one place. Six
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
 * 4. The empty rows. The shared rule centres the LAST child of a row, which is right for the
 *    needle in its 20 px column and wrong for the dash of an empty row, whose only siblings
 *    are the numeral and itself: it floated the dash into the middle of the name column. The
 *    dash starts where a country name starts, so the six rows read as one table.
 *
 * 5. The row at 1024. The name column stops at 260 (the longest name, "Saint Vincent and the
 *    Grenadines", needs 235) and the bar takes everything left over, because a full-width row
 *    on the 720 px desktop column otherwise strands the distance and the bar at the far right
 *    with 300 px of dead air in the middle. A proximity bar is the one element in the row
 *    that WANTS the length: it closes the gap, and six bars on a 300 px scale can finally be
 *    compared against each other at a glance.
 *
 * 6. The error under the field is taken out of the flow (the field reserves its 22 px), so a
 *    refused word does not shove six guess rows down and back up two seconds later. The
 *    readout above reserves two lines on a phone, where the intro copy wraps, and none from
 *    768 up, where every line of it fits on one.
 *
 * The two keyframes animate out of the element's own final transform (blueprint 6.3.8), so a
 * board with animation off (reduced motion, a screenshot pass, no JS at all) still shows
 * every bar at its true length and every needle on its true bearing.
 */
const STYLE = `
.geo .grow { grid-template-columns: 26px minmax(0, 1fr) 62px 48px 20px; }
.geo .grow .bar { background: var(--color-card); }
.geo .grow.empty .dash { border-radius: 1px; justify-self: start; }
.geo .grow:not(.empty) > :last-child { justify-self: center; }
.geo .band-cold { background: var(--color-wait); }
.geo .band-cool { background: var(--color-faint); }
.geo-map .dot-cold, .geo-map .dot-cool, .geo-map .dot-warm, .geo-map .dot-hot, .geo-map .dot-burning { fill: var(--color-ink); }
.geo-map .dot-hit { fill: var(--color-ember); }
.geo .grow .bar i { animation: geo-bar 240ms var(--ease-out); }
.geo .grow .needle { animation: geo-needle 300ms var(--ease-out); }
.geo .read { min-height: 2.9em; }
.geo .typed .field { position: relative; padding-bottom: 22px; }
.geo .typed .field .hint { position: absolute; left: 0; top: 50px; margin: 0; }
@media (min-width: 768px) {
  .geo .read { min-height: 0; }
}
@media (min-width: 1024px) {
  .geo .grow { grid-template-columns: 26px minmax(0, 260px) 72px minmax(0, 1fr) 20px; height: 36px; }
}
@keyframes geo-bar { from { transform: scaleX(0); } }
@keyframes geo-needle { from { transform: rotate(0deg); } }
@media (prefers-reduced-motion: reduce) {
  .geo .grow .bar i, .geo .grow .needle { animation: none; }
}
`;

/**
 * The needle: one ink dart, drawn with a notched tail so the direction reads at 20 px and at
 * any rotation (a two-tone lens turns into a bowtie the moment it is small, and a bare
 * triangle loses its tail). It carries the engine's bearing, which runs FROM the guess TO
 * the answer, so the dart points the way you still have to travel. The bearing is rounded to
 * a whole degree because the browser re-serialises a long one and hydration would then read
 * the server's string as a mismatch.
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
 *
 * The readout says `Norway is 4 021 km away. Answer to the north-east.` and not the
 * blueprint's `Norway is 2 340 km north-east of the answer`, which states the relation
 * backwards: the engine's bearing runs FROM the guess TO the answer (the Worldle
 * convention, and what the needle and the share arrows both draw), so north-east is where
 * the answer sits from Norway, not where Norway sits from the answer. Naming the guess as
 * the subject also keeps the line clear of the definite article that half a dozen country
 * names need in a prepositional phrase (`south of United States`, `west of Netherlands`),
 * and it says the same thing the needle's label says, in the same words.
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
  const items: SuggestItem[] = useMemo(
    () => suggestCountries(text, guessed).map((c) => ({ key: c.iso3, iso2: c.iso2, name: c.displayName })),
    [text, guessed],
  );

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
    const iso3 = resolveGuess(typed)?.iso3;
    if (!iso3) {
      reject(items.length ? "Choose a country from the list." : "Not a country.");
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
      <p className="t-body play-line read" aria-live="polite">
        {!last ? (
          INTRO
        ) : state.phase === "won" ? (
          <>
            <b>{last.name}</b>. Solved in {state.guesses.length}.
          </>
        ) : (
          <>
            {last.name} is <b>{kmLabel(last.distanceKm)}</b> away. Answer to the {last.direction}.
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
            autoSelectFirst={false}
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
                <Needle deg={g.bearingDeg} label={`answer to the ${g.direction}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
