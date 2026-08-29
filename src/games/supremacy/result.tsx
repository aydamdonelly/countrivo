"use client";

import type { SupremacyState } from "@/lib/game-logic/supremacy/engine";
import type { ResultProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";

const OUTCOME = { player: "you", ai: "ai", draw: "draw" } as const;

/** Five rows: the two countries, the stat that decided the round and who took it. */
export function Result({ state }: ResultProps<SupremacyState>) {
  const played = state.rounds.filter((r) => r.winner !== null);
  return (
    <div className="rrows t-row">
      {played.map((r, i) => {
        const stat = state.categories.find((c) => c.slug === r.chosenStat);
        return (
          <div key={i} className="rrow" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
            <span className="nm">
              {r.playerCard.country.displayName} vs {r.aiCard.country.displayName}
              <small>{stat ? statLabel(stat.slug, stat.shortLabel) : ""}</small>
            </span>
            <b className={r.winner === "ai" ? "v bad t-score" : "v t-score"}>{OUTCOME[r.winner ?? "draw"]}</b>
          </div>
        );
      })}
    </div>
  );
}
