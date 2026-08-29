"use client";

import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import type { ResultProps } from "@/games/types";
import type { OddOneOutState } from "@/lib/game-logic/odd-one-out/engine";
import { traitLine } from "./module";

/** Five rows: the four flags with the odd one ringed, the trait, a check or a cross. */
export function Result({ state }: ResultProps<OddOneOutState>) {
  return (
    <div className="rrows t-row">
      {state.rounds.map((round, i) => {
        const ok = state.answers[i] === round.oddIndex;
        return (
          <div key={i} className="rrow flags4">
            <span className="flags">
              {round.countries.map((c, k) => (
                <Flag key={c.iso3} iso2={c.iso2} size="xs" alt="" className={cn(k === round.oddIndex && "odd")} />
              ))}
            </span>
            <span className="nm">{traitLine(round.traitDescription)}</span>
            {ok ? <CheckIcon size={16} className="ic-ok" /> : <CrossIcon size={16} className="ic-miss" />}
          </div>
        );
      })}
    </div>
  );
}
