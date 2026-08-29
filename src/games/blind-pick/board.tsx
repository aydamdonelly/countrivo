"use client";

import { useState } from "react";
import { canUndo, getCurrentCountry, isComplete } from "@/lib/game-logic/blind-pick/engine";
import { chipLabel } from "@/content/chips";
import { Button } from "@/ui/button";
import { Slot } from "@/ui/slot";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import { assignedCount, type BlindPickAction, type BlindPickState } from "./module";

/*
 * The Blind Pick board (blueprint 8.8): the subject at the top, the eight category slots
 * as a 2x4 grid (4x2 on desktop), one row under it, and the reveal window after the eighth
 * pick. Everything is drawn from `state`, so the server HTML is already the board and a
 * resumed run arrives with its picks in place.
 *
 * The game's whole idea is what the board does NOT show: the country on screen is the only
 * one you get to see, so every slot you spend is spent against seven strangers. Two places
 * carry that: `unseen 5` in the session line (module.progress), which counts down all run, and
 * the rule on the row under the grid before the first pick.
 */

/*
 * One geometry for all eight slots, open or filled, phone or desktop.
 *   min-h-[76px]      every slot is the height of a two-line label, so a row never goes
 *                     ragged when `Foreign investment` wraps beside `Coffee`.
 *   justify-between   the label line sits at the top and the stat line at the bottom of
 *                     every slot, so both read across the grid on one baseline.
 *   items-start       the icon (or the flag) and the corner numeral hold the first line
 *                     while the label wraps under them.
 *   min-w-0           a 1fr grid track cannot shrink below its content, and a long country
 *                     name would otherwise widen both columns and push the page sideways.
 *   whitespace-normal names and category labels wrap to a second line instead of being cut;
 *                     the reserved height is already there to hold them.
 */
const SLOT = "min-h-[76px] min-w-0 justify-between [&_.lbl]:items-start [&_.nm]:whitespace-normal";

export function Board({ state, dispatch, busy }: BoardProps<BlindPickState, BlindPickAction>) {
  const { g } = state;
  const country = getCurrentCountry(g);
  const complete = isComplete(g);
  const revealing = complete && !state.seen;
  const undoable = canUndo(g) && !state.seen;
  /*
   * Before the first pick there is no undo to show and nothing has happened yet, so the row
   * says the rule instead. Once a pick has landed the space belongs to the undo, and when the
   * undo is spent the row stays empty rather than repeating a line the player has read: three
   * stacked grey lines under the grid (rule, verdict, key hint) is chatter, not help.
   */
  const hint = !revealing && !undoable && assignedCount(g) === 0;
  /** The run is over and the result panel is under the board: the row has nothing left to hold. */
  const settled = complete && state.seen;

  // Snapshot the move count at mount: a board that arrives resumed (or finished) is settled,
  // and only what moves after that plays the reveal and the counting rank (blueprint 6.3.1, 6.3.2).
  const [movesAtMount] = useState(state.moves);
  const moved = state.moves > movesAtMount;

  return (
    <div className="play-stack">
      {country ? (
        <CountryBlock key={g.currentStep} country={country} animate={moved} />
      ) : revealing ? (
        <div className="subj">
          <b className="t-card">Final pick in.</b>
        </div>
      ) : null}

      <div className="slot-grid">
        {g.config.categories.map((cat, i) => {
          const countryIdx = g.assignments.indexOf(i);
          if (countryIdx >= 0) {
            const picked = g.config.countries[countryIdx];
            return (
              <Slot
                key={cat.slug}
                className={SLOT}
                state="assigned"
                iso2={picked.iso2}
                country={picked.displayName}
                rank={g.config.costMatrix[countryIdx][i]}
                label={chipLabel(cat.slug)}
                animate={moved && state.lastPick === countryIdx}
              />
            );
          }
          return (
            <Slot
              key={cat.slug}
              className={SLOT}
              state="open"
              slug={cat.slug}
              label={chipLabel(cat.slug)}
              clarifier={cat.clarifier}
              keyHint={String(i + 1)}
              onClick={() => dispatch({ t: "pick", c: i })}
              disabled={busy || country === null}
              aria-label={`Put ${country ? country.displayName : "this country"} on ${chipLabel(cat.slug)}`}
            />
          );
        })}
      </div>

      {/*
        One row under the grid, always 44 px tall whether it is full or empty, so the board
        never jumps mid-run. It says the rule while there is nothing else to say, then hands
        the space to the undo, then to the reveal window's button. Once the run has settled
        the result panel sits under the board and the row is gone.
      */}
      {settled ? null : (
        <div className="play-actions min-h-11">
          {revealing ? (
            <Button variant="ink" onClick={() => dispatch({ t: "seen" })}>
              See result
            </Button>
          ) : null}
          {undoable ? (
            <Button variant="text" icon="undo" onClick={() => dispatch({ t: "undo" })}>
              Undo last pick · 1 left
            </Button>
          ) : null}
          {hint ? <p className="t-body play-line">You never see the next country.</p> : null}
        </div>
      )}
    </div>
  );
}
