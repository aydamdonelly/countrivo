"use client";

import { riskMultiplier, type RiskZoneState } from "@/lib/game-logic/risk-zone/engine";
import type { ResultProps } from "@/games/types";

/** Five chain rows: the stat, `+225 (x2.25)` or `wiped` in ember. */
export function Result({ state }: ResultProps<RiskZoneState>) {
  return (
    <div className="rrows t-row">
      {state.log.map((c, i) => (
        <div key={i} className="rrow" style={{ gridTemplateColumns: "18px 1fr auto" }}>
          <span className="t-meta play-line">{i + 1}</span>
          <span className="nm">{c.category}</span>
          {c.outcome === "banked" ? (
            <b className="v t-score num">
              +{c.points} <span className="t-meta play-line">(x{riskMultiplier(c.bankedAt)})</span>
            </b>
          ) : (
            <span className="v bad t-meta">wiped</span>
          )}
        </div>
      ))}
    </div>
  );
}
