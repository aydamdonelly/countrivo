"use client";

import { formatStat } from "@/lib/utils";
import { getStatValue } from "@/lib/data/ranks";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import type { ResultProps } from "@/games/types";
import type { SortState } from "./module";

/** The correct order with the value, a check where you placed it right. */
export function Result({ state }: ResultProps<SortState>) {
  const { g } = state;
  return (
    <div className="rrows t-row">
      {g.correctOrder.map((ci, pos) => {
        const c = g.countries[ci];
        const value = getStatValue(c.iso3, g.category.slug);
        const placed = getStatValue(g.countries[g.userOrder[pos]].iso3, g.category.slug);
        const ok = value !== null && value === placed;
        return (
          <div key={c.iso3} className="rrow cols4">
            <Flag iso2={c.iso2} size="xs" alt="" />
            <span className="nm">
              {pos + 1}. {c.displayName}
            </span>
            <b className="v t-score num">{value === null ? "" : formatStat(value, g.category.unit)}</b>
            {ok ? <CheckIcon size={16} className="ic-ok" /> : <CrossIcon size={16} className="ic-miss" />}
          </div>
        );
      })}
    </div>
  );
}
