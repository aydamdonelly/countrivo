"use client";

import { useRef } from "react";
import { canUndo, getCurrentCountry, isComplete } from "@/lib/game-logic/country-draft/engine";
import { chipLabel } from "@/content/chips";
import { Button } from "@/ui/button";
import { Slot } from "@/ui/slot";
import type { BoardProps } from "@/games/types";
import { CountryBlock } from "@/games/_shared/country-block";
import type { DraftAction, DraftState } from "./module";

/** The Draft board (blueprint 8.8): the subject, the 2x4 slot grid, undo, and the reveal window's See result. */
export function Board({ state, dispatch, busy }: BoardProps<DraftState, DraftAction>) {
  const { g } = state;
  const country = getCurrentCountry(g);
  const complete = isComplete(g);
  const firstStep = useRef(g.currentStep);
  return (
    <div className="play-stack">
      {country ? (
        <CountryBlock key={g.currentStep} country={country} animate={g.currentStep !== firstStep.current} />
      ) : (
        <p className="play-center t-body play-line">All picks in. Every rank is on the board.</p>
      )}
      <div className="slot-grid">
        {g.config.categories.map((cat, i) => {
          const countryIdx = g.assignments.indexOf(i);
          if (countryIdx >= 0) {
            const c = g.config.countries[countryIdx];
            return <Slot key={cat.slug} state="assigned" iso2={c.iso2} country={c.displayName} rank={g.config.costMatrix[countryIdx][i]} label={chipLabel(cat.slug)} animate={state.lastPick === countryIdx} />;
          }
          return <Slot key={cat.slug} state="open" slug={cat.slug} label={chipLabel(cat.slug)} clarifier={cat.clarifier} keyHint={String(i + 1)} onClick={() => dispatch({ t: "pick", c: i })} disabled={busy || !country} />;
        })}
      </div>
      <div className="play-actions">
        {complete && !state.seen ? (
          <Button variant="ink" onClick={() => dispatch({ t: "seen" })}>
            See result
          </Button>
        ) : null}
        {canUndo(g) ? (
          <Button variant="text" icon="undo" onClick={() => dispatch({ t: "undo" })}>
            Undo last pick · 1 left
          </Button>
        ) : null}
      </div>
    </div>
  );
}
