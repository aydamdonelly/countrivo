import type { Category } from "@/types/category";
import type { Country } from "@/types/country";
import { cn } from "@/lib/utils";

interface CategorySlotProps {
  category: Category;
  isAvailable: boolean;
  assignedCountry: Country | null;
  rank: number | null;
  onClick: () => void;
}

export function CategorySlot({
  category,
  isAvailable,
  assignedCountry,
  rank,
  onClick,
}: CategorySlotProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      aria-label={
        isAvailable
          ? `Assign to ${category.label}`
          : assignedCountry
          ? `${assignedCountry.displayName} assigned to ${category.label}, rank #${rank}`
          : `${category.label} — unavailable`
      }
      className={cn(
        "relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 min-h-30 sm:min-h-35",
        isAvailable &&
          "border-border-hover bg-gold-dim hover:border-gold hover:bg-gold-dim hover:shadow-lg cursor-pointer active:scale-[0.96]",
        !isAvailable && assignedCountry &&
          "border-correct/20 bg-correct-light cursor-default",
        !isAvailable && !assignedCountry &&
          "border-border bg-surface opacity-40 cursor-not-allowed"
      )}
    >
      {assignedCountry ? (
        <>
          <span className="text-3xl sm:text-4xl">{assignedCountry.flagEmoji}</span>
          <span className="text-sm sm:text-base font-bold text-cream mt-2 truncate max-w-full px-1">
            {assignedCountry.displayName}
          </span>
          <span className={cn(
            "text-sm font-bold mt-1.5 px-3 py-1 rounded-lg",
            rank !== null && rank <= 5 && "bg-correct/20 text-correct",
            rank !== null && rank > 5 && rank <= 20 && "bg-gold-dim text-gold",
            rank !== null && rank > 20 && "bg-incorrect/10 text-incorrect"
          )}>
            {category.emoji} #{rank}
          </span>
        </>
      ) : (
        <>
          <span className="text-4xl sm:text-5xl mb-2">{category.emoji}</span>
          <span className="text-sm sm:text-base font-bold text-cream-muted leading-tight text-center">
            {category.shortLabel}
          </span>
        </>
      )}
    </button>
  );
}
