"use client";

import type { RiskZoneState } from "@/lib/game-logic/risk-zone/engine";
import { StatIcon } from "@/ui/icons/stat";
import type { ResultProps } from "@/games/types";
import { spaceThousands } from "@/games/_shared/format";
import { chainRows } from "./module";

/**
 * The rows under the result card (blueprint 8.8): the five chains, each with the stat it was
 * played on, how far it ran and what it paid. A wiped chain reads in ember, the only second
 * colour on the panel, so the two that cost the run are legible at a glance.
 */
export function Result({ state }: ResultProps<RiskZoneState>) {
  const rows = chainRows(state);
  if (rows.length === 0) return null;
  const banked = rows.filter((r) => r.outcome === "banked").length;
  return (
    <div>
      <div className="rhead">
        <b className="t-h3">Chains</b>
        <span className="rfacts t-body">
          <b>{banked}</b> banked of <b>{rows.length}</b>
        </span>
      </div>
      <div className="rrows t-row">
        {rows.map((row) => (
          <div key={row.index} className="rrow">
            <StatIcon slug={state.chains[row.index]?.category.slug ?? ""} size={18} />
            <span className="nm">
              {row.stat}
              <small className="t-meta">{row.correct} correct</small>
            </span>
            {row.outcome === "banked" ? (
              <b className="v t-score num">
                +{spaceThousands(row.points)} <span className="t-meta play-line">({row.multiplier})</span>
              </b>
            ) : (
              <span className="v bad t-meta">wiped</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
