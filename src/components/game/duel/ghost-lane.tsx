"use client";

interface GhostLaneProps {
  name: string;
  /** opponent's running correct count, revealed in lockstep with the player */
  correct: number;
  total: number;
  /** per-decision outcomes for the indices the player has already passed */
  revealed: Array<"correct" | "wrong">;
}

/**
 * Opponent "ghost" panel shown beside a live duel board. Purely presentational:
 * the board re-derives each outcome from the regenerated (same-seed) questions
 * and reveals decision N only once the player commits decision N — so the ghost
 * appears to play at exactly the player's pace (no timestamps, no realtime).
 */
export function GhostLane({ name, correct, total, revealed }: GhostLaneProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold truncate">{name}</span>
          <span className="text-xs font-bold tabular-nums text-cream-muted">
            {correct}/{total}
          </span>
        </div>
        <div className="mt-1 flex gap-1" aria-hidden>
          {Array.from({ length: total }).map((_, i) => {
            const r = revealed[i];
            return (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  r === "correct"
                    ? "bg-correct"
                    : r === "wrong"
                      ? "bg-incorrect"
                      : "bg-cream-ghost"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
