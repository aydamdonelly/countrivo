"use client";

import type { CSSProperties } from "react";
import { formatStat } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import type { ResultProps } from "@/games/types";
import { placedRight, statOf, type SortState } from "./module";

const COLS: CSSProperties = { gridTemplateColumns: "18px 26px minmax(0, 1fr) auto auto" };
const RANK: CSSProperties = { color: "var(--color-mute)" };

/**
 * The order as it really runs, with each country's value; a check where the player had that
 * position right, a cross where they did not (blueprint 8.8). The kept board above shows
 * what they submitted, so the two read as their order against the world's.
 */
export function Result({ state }: ResultProps<SortState>) {
  const { g } = state;
  return (
    <div className="rrows t-row">
      {g.correctOrder.map((ci, pos) => {
        const country = g.countries[ci];
        const value = statOf(g, ci);
        const right = placedRight(g, pos);
        return (
          <div key={country.iso3} className="rrow" style={COLS}>
            <b className="t-num num" style={RANK}>
              {pos + 1}
            </b>
            <Flag iso2={country.iso2} size="xs" alt="" />
            <span className="nm">{country.displayName}</span>
            <b className="v t-score num">{value === null ? "" : formatStat(value, g.category.unit)}</b>
            {right ? <CheckIcon size={16} className="ic-ok" title="in place" /> : <CrossIcon size={16} className="ic-miss" title="out of place" />}
          </div>
        );
      })}
    </div>
  );
}
