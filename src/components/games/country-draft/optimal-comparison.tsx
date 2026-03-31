import type { DraftGameConfig, DraftAssignment } from "@/lib/game-logic/country-draft/types";
import { cn } from "@/lib/utils";

interface OptimalComparisonProps {
  config: DraftGameConfig;
  playerAssignments: DraftAssignment[];
  optimalAssignments: DraftAssignment[];
}

export function OptimalComparison({
  config,
  playerAssignments,
  optimalAssignments,
}: OptimalComparisonProps) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 sm:px-6 py-3 bg-surface text-sm font-bold text-cream-muted border-b border-border">
        <span>Country</span>
        <span className="text-center w-28 sm:w-32">Your Pick</span>
        <span className="text-center w-28 sm:w-32">Optimal</span>
      </div>

      {/* Rows */}
      {playerAssignments.map((pa, i) => {
        const country = config.countries[pa.countryIdx];
        const playerCat = config.categories[pa.categoryIdx];
        const optimalA = optimalAssignments.find(
          (oa) => oa.countryIdx === pa.countryIdx
        )!;
        const optimalCat = config.categories[optimalA.categoryIdx];

        const isMatch = pa.categoryIdx === optimalA.categoryIdx;
        const isClose = !isMatch && Math.abs(pa.rank - optimalA.rank) <= 10;

        return (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[1fr_auto_auto] gap-3 px-5 sm:px-6 py-3.5 border-b border-border last:border-b-0",
              isMatch && "bg-correct/5",
              isClose && !isMatch && "bg-gold-dim"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl sm:text-3xl shrink-0">{country.flagEmoji}</span>
              <span className="text-base font-semibold truncate">{country.displayName}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-28 sm:w-32">
              <span className="text-base">{playerCat.emoji}</span>
              <span
                className={cn(
                  "font-mono text-base font-bold",
                  pa.rank <= 5 && "text-correct",
                  pa.rank > 5 && pa.rank <= 20 && "text-gold",
                  pa.rank > 20 && "text-incorrect"
                )}
              >
                #{pa.rank}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-28 sm:w-32">
              <span className="text-base">{optimalCat.emoji}</span>
              <span className="font-mono text-base font-bold text-cream-muted">
                #{optimalA.rank}
              </span>
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 sm:px-6 py-4 bg-surface text-base font-extrabold border-t border-border">
        <span>Total</span>
        <span className="text-center w-28 sm:w-32 font-mono">
          {playerAssignments.reduce((s, a) => s + a.rank, 0)}
        </span>
        <span className="text-center w-28 sm:w-32 font-mono text-cream-muted">
          {optimalAssignments.reduce((s, a) => s + a.rank, 0)}
        </span>
      </div>
    </div>
  );
}
