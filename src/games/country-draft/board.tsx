"use client";

import { useState } from "react";
import { canUndo, getCurrentCountry, isComplete } from "@/lib/game-logic/country-draft/engine";
import { chipLabel } from "@/content/chips";
import { Button } from "@/ui/button";
import { Slot } from "@/ui/slot";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import type { DraftAction, DraftState } from "./module";

/*
 * The Country Draft board (blueprint 8.8): the subject at the top, the eight category slots
 * as a 2x4 grid (4x2 on desktop), the one undo under it, and the reveal window after the
 * eighth pick. Everything is drawn from `state`, so the server HTML is already the board and
 * a resumed run arrives with its picks in place.
 */
export function Board({ state, dispatch, busy }: BoardProps<DraftState, DraftAction>) {
  const { g } = state;
  const country = getCurrentCountry(g);
  const complete = isComplete(g);
  const revealing = complete && !state.seen;
  const undoable = canUndo(g) && !state.seen;

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

      {/* min-w-0 on every slot: a grid track sized 1fr cannot shrink below its item's
          min-content width, and the slot's text is set nowrap, so a long country name would
          widen both tracks and push the page sideways. With the minimum released the track
          stays at half the column and the name ellipsizes instead (Slot's own overflow rule).
          The open slots also let their category label wrap: it is fixed copy the player has to
          read to make the pick, and `Foreign investment` does not fit one line on a 390 phone. */}
      <div className="slot-grid">
        {g.config.categories.map((cat, i) => {
          const countryIdx = g.assignments.indexOf(i);
          if (countryIdx >= 0) {
            const picked = g.config.countries[countryIdx];
            return (
              <Slot
                key={cat.slug}
                className="min-w-0 [&_.lbl]:flex-wrap [&_.lbl]:gap-y-0 [&_.nm]:basis-[calc(100%-32px)]"
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
              className="min-w-0 [&_.nm]:whitespace-normal"
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

      {revealing || undoable ? (
        <div className="play-actions">
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
        </div>
      ) : null}
    </div>
  );
}
