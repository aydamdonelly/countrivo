"use client";

import { useState } from "react";
import type { DraftResult, DraftGameConfig } from "@/lib/game-logic/country-draft/types";

interface DraftShareCardProps {
  result: DraftResult;
  dateKey: string;
  config: DraftGameConfig;
}

function getRankEmoji(rank: number, optimalRank: number): string {
  const diff = rank - optimalRank;
  if (diff === 0) return "🟩";
  if (diff <= 10) return "🟨";
  return "🟥";
}

export function DraftShareCard({ result, dateKey, config }: DraftShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = generateShareText(result, dateKey, config);

  const handleCopy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleCopy}
        className="px-8 py-4 bg-surface-inverse text-text-inverse font-bold text-lg rounded-xl hover:opacity-90 transition-opacity"
      >
        {copied ? "Copied!" : "Share Result"}
      </button>

      <pre className="text-sm text-text-muted bg-surface-muted p-5 rounded-xl max-w-full overflow-x-auto whitespace-pre font-mono leading-relaxed">
        {shareText}
      </pre>
    </div>
  );
}

function generateShareText(
  result: DraftResult,
  dateKey: string,
  config: DraftGameConfig
): string {
  const lines: string[] = [];
  const isDaily = !dateKey.startsWith("practice-");

  lines.push(
    `🎯 Country Draft${isDaily ? ` — ${formatDate(dateKey)}` : ""}`
  );
  lines.push(
    `Score: ${result.playerScore} | Optimal: ${result.optimalScore} | Gap: ${result.gap}`
  );
  lines.push(`${"⭐".repeat(result.stars)} ${capitalize(result.grade)}!`);
  lines.push("");

  for (const pa of result.assignments) {
    const country = config.countries[pa.countryIdx];
    const cat = config.categories[pa.categoryIdx];
    const optA = result.optimalAssignments.find(
      (oa) => oa.countryIdx === pa.countryIdx
    )!;
    const emoji = getRankEmoji(pa.rank, optA.rank);

    lines.push(`${cat.emoji} ${emoji} ${country.displayName} → ${cat.shortLabel} (#${pa.rank})`);
  }

  lines.push("");
  lines.push("countrivo.com/games/country-draft");

  return lines.join("\n");
}

function formatDate(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
