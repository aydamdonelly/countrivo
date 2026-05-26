"use client";

import { getCountryByIso3 } from "@/lib/data/countries";

interface ClusterGridProps {
  cells: string[];
  selected: string[];
  solvedIso3s: Set<string>;
  onToggle: (iso3: string) => void;
  shakeKey?: number;
  nearMiss?: boolean;
  disabled?: boolean;
}

export function ClusterGrid({
  cells,
  selected,
  solvedIso3s,
  onToggle,
  shakeKey,
  nearMiss,
  disabled,
}: ClusterGridProps) {
  const remaining = cells.filter((iso3) => !solvedIso3s.has(iso3));
  const selectedSet = new Set(selected);

  return (
    <div
      key={shakeKey}
      className={`grid grid-cols-4 gap-2 sm:gap-3 ${shakeKey ? (nearMiss ? "animate-[wiggle_0.35s_ease]" : "animate-[shake_0.4s_ease]") : ""}`}
    >
      {remaining.map((iso3) => {
        const country = getCountryByIso3(iso3);
        const isSelected = selectedSet.has(iso3);
        return (
          <button
            key={iso3}
            type="button"
            onClick={() => onToggle(iso3)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={country?.displayName ?? iso3}
            className={`group relative aspect-square rounded-xl border-2 bg-surface p-2 flex flex-col items-center justify-center gap-1 transition-all ${
              isSelected
                ? "border-gold bg-gold-dim ring-2 ring-gold/40 scale-[0.97]"
                : "border-border hover:border-gold/60 hover:bg-surface-elevated active:scale-[0.97]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-3xl sm:text-4xl leading-none select-none">
              {country?.flagEmoji ?? "🏳️"}
            </span>
            <span className="text-[10px] sm:text-xs font-bold tabular-nums text-cream-muted truncate max-w-full px-1">
              {country?.displayName ?? iso3}
            </span>
          </button>
        );
      })}
    </div>
  );
}
