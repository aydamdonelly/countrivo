"use client";

import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { StatIcon } from "@/ui/icons/stat";
import { rankQuality } from "@/ui/slot";
import type { ResultProps } from "@/games/types";
import { GRADE_WORD, RANK_CELL, type DraftState } from "./module";

/** The head line and the eight pick rows (blueprint 8.8): your pick beside the optimal one. */
export function Result({ state }: ResultProps<DraftState>) {
  const r = computeResult(state.g);
  const cfg = state.g.config;
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{GRADE_WORD[r.grade]}</b>
        <span className="rfacts t-body">
          you <b className="num">{r.playerScore}</b> · optimal <b className="num">{r.optimalScore}</b> · gap <b className="num">{r.gap}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {r.assignments.map((a) => {
          const country = cfg.countries[a.countryIdx];
          const optimal = r.optimalAssignments[a.countryIdx];
          const same = optimal.categoryIdx === a.categoryIdx;
          return (
            <div key={country.iso3} className="rrow cols4">
              <Flag iso2={country.iso2} size="xs" alt="" />
              <span className="nm">{country.displayName}</span>
              <span className="v" style={RANK_CELL}>
                <StatIcon slug={cfg.categories[a.categoryIdx].slug} size={18} />
                <b className={`t-score num rank-${rankQuality(a.rank)}`}>#{a.rank}</b>
              </span>
              <span className="v mute t-meta" style={{ ...RANK_CELL, justifyContent: same ? "flex-end" : RANK_CELL.justifyContent }}>
                {same ? (
                  <CheckIcon size={16} className="ic-ok" />
                ) : (
                  <>
                    <StatIcon slug={cfg.categories[optimal.categoryIdx].slug} size={18} />
                    <span className="num">#{optimal.rank}</span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
