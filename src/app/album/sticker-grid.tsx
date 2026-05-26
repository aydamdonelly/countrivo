"use client";

import { useState } from "react";
import type { Country } from "@/types/country";

export interface StickerEntry {
  count: number;
  firstSlug: string;
  firstDate: string;
}

interface StickerGridProps {
  countries: Country[];
  stickers: Record<string, StickerEntry>;
}

type Tier = "empty" | "bronze" | "silver" | "gold";

function tierFor(count: number): Tier {
  if (count <= 0) return "empty";
  if (count < 5) return "bronze";
  if (count < 10) return "silver";
  return "gold";
}

const TIER_CLASS: Record<Tier, string> = {
  empty:
    "border-border bg-surface-elevated text-cream-muted opacity-40 grayscale",
  bronze: "border-[#96700a]/40 bg-[#96700a]/8 text-cream",
  silver: "border-[#9ca3af]/60 bg-[#9ca3af]/10 text-cream",
  gold: "border-gold bg-gold-dim text-cream ring-1 ring-gold/30",
};

function formatSlug(slug: string): string {
  if (slug === "trace") return "Trace";
  if (slug === "country-draft") return "Country Draft";
  if (slug === "stat-guesser") return "Stat Guesser";
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function StickerGrid({ countries, stickers }: StickerGridProps) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div
      className="grid gap-1.5 sm:gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}
    >
      {countries.map((country) => {
        const sticker = stickers[country.iso3];
        const count = sticker?.count ?? 0;
        const tier = tierFor(count);
        const isActive = active === country.iso3;

        const tooltip = sticker
          ? `First stamped ${sticker.firstDate} via ${formatSlug(sticker.firstSlug)}${
              sticker.count > 1 ? ` · ${sticker.count}×` : ""
            }`
          : `${country.displayName} — not yet collected. Win a daily to stamp it.`;

        return (
          <div key={country.iso3} className="relative">
            <button
              type="button"
              onClick={() => setActive(isActive ? null : country.iso3)}
              onMouseEnter={() => setActive(country.iso3)}
              onMouseLeave={() => setActive((prev) => (prev === country.iso3 ? null : prev))}
              onFocus={() => setActive(country.iso3)}
              onBlur={() => setActive((prev) => (prev === country.iso3 ? null : prev))}
              aria-label={`${country.displayName}. ${tooltip}`}
              className={`group relative w-full aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 hover:z-10 ${TIER_CLASS[tier]}`}
            >
              <span className="text-xl sm:text-2xl leading-none" aria-hidden="true">
                {country.flagEmoji}
              </span>
              <span className="font-mono text-xxs uppercase tracking-wider">
                {country.iso3}
              </span>
              {count > 1 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-gold text-white text-[9px] font-bold flex items-center justify-center font-mono">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
            {isActive && (
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none whitespace-nowrap rounded-md bg-cream text-bg text-xxs font-medium px-2 py-1 shadow-md"
              >
                <span className="font-bold">{country.displayName}</span>
                <span className="opacity-70"> · {tooltip.replace(`${country.displayName} — `, "")}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
