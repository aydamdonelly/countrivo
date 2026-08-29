"use client";

import { Flag } from "@/ui/flag";
import type { ResultProps } from "@/games/types";
import type { HoLState } from "./module";

/** The last five pairs: left vs right, the stat, your call; the wrong one in ember. */
export function Result({ state }: ResultProps<HoLState>) {
  const g = state.g;
  const lost = g.phase === "gameover" && g.lastAnswer === "wrong";
  const lastIdx = lost ? g.currentRound : g.currentRound - 1;
  const from = Math.max(0, lastIdx - 4);
  const rows = [];
  for (let i = from; i <= lastIdx; i++) {
    const r = g.rounds[i];
    if (!r) continue;
    const wrong = lost && i === lastIdx;
    const call = wrong ? (r.answer === "higher" ? "lower" : "higher") : r.answer;
    rows.push(
      <div key={i} className="rrow">
        <Flag iso2={r.right.iso2} size="xs" alt="" />
        <span className="nm">
          {r.left.displayName} vs {r.right.displayName}
          <small className="t-meta">{r.category.shortLabel}</small>
        </span>
        <span className={wrong ? "v bad t-meta" : "v mute t-meta"}>{call}</span>
      </div>,
    );
  }
  if (rows.length === 0) return <p className="t-body play-line">First call is the hardest.</p>;
  return <div className="rrows t-row">{rows}</div>;
}
