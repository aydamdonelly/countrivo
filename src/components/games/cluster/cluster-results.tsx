"use client";

import { getCountryByIso3 } from "@/lib/data/countries";
import type { ClusterDifficulty, ClusterGroup } from "@/lib/game-logic/cluster/types";

export const DIFFICULTY_STYLES: Record<
  ClusterDifficulty,
  { label: string; bg: string; text: string; ring: string; emoji: string }
> = {
  easy: {
    label: "Easy",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    ring: "ring-emerald-300",
    emoji: "🟩",
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-100",
    text: "text-amber-800",
    ring: "ring-amber-300",
    emoji: "🟨",
  },
  hard: {
    label: "Hard",
    bg: "bg-blue-100",
    text: "text-blue-800",
    ring: "ring-blue-300",
    emoji: "🟦",
  },
  purple: {
    label: "Purple",
    bg: "bg-purple-100",
    text: "text-purple-800",
    ring: "ring-purple-300",
    emoji: "🟪",
  },
};

interface SolvedRowProps {
  group: ClusterGroup;
  revealed?: boolean;
  faded?: boolean;
}

export function SolvedRow({ group, revealed = true, faded = false }: SolvedRowProps) {
  const style = DIFFICULTY_STYLES[group.difficulty];
  return (
    <div
      className={`rounded-xl px-3 py-3 sm:px-4 ${style.bg} ${faded ? "opacity-70" : ""} ${
        revealed ? "animate-scale-in" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-sm sm:text-base font-bold ${style.text} truncate`}>
          {group.theme}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/60 ${style.text}`}
        >
          {style.label}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {group.countryIso3s.map((iso3) => {
          const country = getCountryByIso3(iso3);
          return (
            <span
              key={iso3}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium"
            >
              <span className="text-base sm:text-lg leading-none">
                {country?.flagEmoji ?? "🏳️"}
              </span>
              <span className={style.text}>{country?.displayName ?? iso3}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface ClusterResultsProps {
  groups: ClusterGroup[];
  unsolved?: ClusterGroup[];
}

export function ClusterResults({ groups, unsolved = [] }: ClusterResultsProps) {
  return (
    <div className="space-y-2.5">
      {groups.map((g) => (
        <SolvedRow key={g.theme} group={g} />
      ))}
      {unsolved.map((g) => (
        <SolvedRow key={g.theme} group={g} faded />
      ))}
    </div>
  );
}
