"use client";

import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import type { DraftResult } from "@/lib/game-logic/country-draft/types";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { StatIcon } from "@/ui/icons/stat";
import { rankQuality } from "@/ui/slot";
import type { ResultProps } from "@/games/types";
import type { DraftState } from "./module";

const GRADE_WORD: Record<DraftResult["grade"], string> = { perfect: "Perfect.", excellent: "Excellent.", great: "Great.", good: "Good.", okay: "Okay.", poor: "Poor." };

/** The head line and the 8 pick rows (blueprint 8.8): your pick and the optimal pick, a check where they match. */
export function Result({ state }: ResultProps<DraftState>) {
  const r = computeResult(state.g);
  const cfg = state.g.config;
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{GRADE_WORD[r.grade]}</b>
        <span className="facts t-body">
          you <b>{r.playerScore}</b> · optimal <b>{r.optimalScore}</b> · gap <b>{r.gap}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {r.assignments.map((a) => {
          const c = cfg.countries[a.countryIdx];
          const opt = r.optimalAssignments[a.countryIdx];
          const same = opt.categoryIdx === a.categoryIdx;
          return (
            <div key={c.iso3} className="rrow cols4">
              <Flag iso2={c.iso2} size="xs" alt="" />
              <span className="nm">{c.displayName}</span>
              <span className="v">
                <StatIcon slug={cfg.categories[a.categoryIdx].slug} size={18} /> <b className={`t-score num rank-${rankQuality(a.rank)}`}>#{a.rank}</b>
              </span>
              {same ? (
                <CheckIcon size={16} className="ic-ok" />
              ) : (
                <span className="v mute t-meta">
                  <StatIcon slug={cfg.categories[opt.categoryIdx].slug} size={18} /> #{opt.rank}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
