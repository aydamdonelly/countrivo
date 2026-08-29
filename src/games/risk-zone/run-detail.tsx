import { riskMultiplier } from "@/lib/game-logic/risk-zone/engine";
import type { RunDetailProps } from "@/games/types";
import { spaceThousands } from "@/games/_shared/format";

interface StoredChain {
  outcome?: unknown;
  bankedAt?: unknown;
  points?: unknown;
}

/**
 * The run page rows (blueprint 7.7, 8.7). `resultJson` keeps only what the validator checks
 * (score and the five chains as outcome, bankedAt, points), so the row reads the chain
 * number, how far it ran and what it paid; the stat a chain was played on is not stored and
 * is never invented here. A run saved with an unreadable chain list falls back to nothing
 * rather than printing raw JSON.
 */
export function RunDetail({ run }: RunDetailProps) {
  const raw = run.resultJson?.chains;
  const rows = Array.isArray(raw)
    ? (raw as StoredChain[]).map((c, i) => ({
        index: i,
        banked: c.outcome === "banked",
        points: typeof c.points === "number" ? c.points : 0,
        correct: typeof c.bankedAt === "number" ? c.bankedAt : 0,
      }))
    : [];
  if (rows.length === 0) return null;
  return (
    <div className="rrows t-row">
      {rows.map((row) => (
        <div key={row.index} className="rrow" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="nm">
            chain {row.index + 1}
            <small className="t-meta">{row.correct} correct</small>
          </span>
          {row.banked ? (
            <b className="v t-score num">
              +{spaceThousands(row.points)} <span className="t-meta play-line">(x{riskMultiplier(row.correct)})</span>
            </b>
          ) : (
            <span className="v bad t-meta">wiped</span>
          )}
        </div>
      ))}
    </div>
  );
}
