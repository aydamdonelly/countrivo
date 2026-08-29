"use client";

import type { SprintState } from "@/lib/game-logic/continent-sprint/engine";
import type { ResultProps } from "@/games/types";
import { FoundList } from "@/games/_shared/found-list";
import { mmss } from "@/games/_shared/format";

/** The head line and the full continent, found or missed, in a scroll box. */
export function Result({ state }: ResultProps<SprintState>) {
  const found = new Set(state.found);
  return (
    <div>
      <p className="rhead t-body">
        <span className="rfacts">
          <b>{state.continent}</b> in <b>{mmss(state.elapsed)}</b>
        </span>
      </p>
      <FoundList items={state.allCountries.map((c) => ({ iso2: c.iso2, name: c.displayName, ok: found.has(c.iso3) }))} scroll />
    </div>
  );
}
