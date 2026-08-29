"use client";

import { formatStat } from "@/lib/utils";
import type { StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";

/** Five rows: the flag, the country and stat, the actual value, the error. */
export function Result({ state }: ResultProps<StatGuesserState>) {
  return (
    <div className="rrows t-row">
      {state.rounds.map((r, i) => {
        const e = state.scores[i] ?? 0;
        return (
          <div key={`${r.country.iso3}-${i}`} className="rrow cols4">
            <Flag iso2={r.country.iso2} size="xs" alt="" />
            <span className="nm">
              {r.country.displayName}
              <small className="t-meta">{statLabel(r.category.slug, r.category.shortLabel)}</small>
            </span>
            <b className="v t-score num">{formatStat(r.actualValue, r.category.unit)}</b>
            <span className={`v t-meta ${e >= 50 ? "bad" : "mute"}`}>{e} % off</span>
          </div>
        );
      })}
    </div>
  );
}
