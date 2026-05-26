"use client";

import { useState } from "react";
import type { ClusterAttempt, ClusterGroup } from "@/lib/game-logic/cluster/types";

interface ClusterShareCardProps {
  groups: ClusterGroup[]; // puzzle's 4 hidden groups
  solvedGroups: ClusterGroup[]; // solved in order
  attempts: ClusterAttempt[];
  won: boolean;
  dateKey: string; // YYYY-MM-DD or "practice-..."
}

const DIFF_EMOJI: Record<string, string> = {
  easy: "🟩",
  medium: "🟨",
  hard: "🟦",
  purple: "🟪",
};

export function buildClusterShareText({
  groups,
  solvedGroups,
  attempts,
  won,
  dateKey,
}: ClusterShareCardProps): string {
  const lines: string[] = [];
  const isDaily = !dateKey.startsWith("practice-");

  const dateStamp = isDaily ? formatDateStamp(dateKey) : "Practice";
  lines.push(`Countrivo · Cluster · ${dateStamp}`);

  const misses = attempts.filter((a) => !a.correct).length;
  const headlineRight = won ? `Solved in ${misses} miss${misses === 1 ? "" : "es"}` : "Did not finish";
  lines.push("");

  // One emoji row per solved group, in the order solved.
  for (const g of solvedGroups) {
    const emoji = DIFF_EMOJI[g.difficulty] ?? "⬜";
    lines.push(emoji.repeat(4));
  }

  // For unsolved groups, append a black-square row representing each unused attempt
  // (only when the player lost — keeps grid square at 4 rows for daily).
  if (!won) {
    const remainingGroups = groups.length - solvedGroups.length;
    for (let i = 0; i < remainingGroups; i++) {
      lines.push("⬛⬛⬛⬛");
    }
  }

  // Right-align the headline beside the first row for share readability.
  if (lines[2]) lines[2] = `${lines[2]}  ${headlineRight}`;

  lines.push("");
  lines.push("countrivo.com");
  return lines.join("\n");
}

function formatDateStamp(dateKey: string): string {
  // YYYY-MM-DD → DD · MM · YY
  const [yyyy, mm, dd] = dateKey.split("-");
  if (!yyyy || !mm || !dd) return dateKey;
  return `${dd} · ${mm} · ${yyyy.slice(2)}`;
}

export function ClusterShareCard(props: ClusterShareCardProps) {
  const [copied, setCopied] = useState(false);
  const shareText = buildClusterShareText(props);

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ text: shareText });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled — silent
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleShare}
        className="cta-secondary"
        type="button"
      >
        {copied ? "Copied!" : "Share grid"}
      </button>

      <pre className="text-sm text-cream-muted bg-surface p-5 rounded-xl whitespace-pre font-mono leading-relaxed">
        {shareText}
      </pre>
    </div>
  );
}
