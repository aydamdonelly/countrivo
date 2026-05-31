"use client";

import { useMemo, useState } from "react";
import { buildCountryDraftShareText } from "./country-draft-grid";
import { buildStatGuesserShareText } from "./stat-guesser-grid";

type ShareGame = "country-draft" | "stat-guesser";

interface ShareCardProps {
  game: ShareGame;
  /** Per-game payload — shape narrowed at runtime by `buildShareText`. */
  result: Record<string, unknown>;
  dateKey: string;
}

/* ---------- per-game shape narrowing ---------- */

type DraftAssignment = { countryIdx: number; rank: number };

function buildShareText(game: ShareGame, result: Record<string, unknown>, dateKey: string): string {
  switch (game) {
    case "country-draft": {
      const assignments = (result.assignments ?? []) as DraftAssignment[];
      const optimalAssignments = (result.optimalAssignments ?? []) as DraftAssignment[];
      return buildCountryDraftShareText(
        {
          playerScore: Number(result.playerScore ?? 0),
          assignments,
          optimalAssignments,
          rank: (result.rank as number | null | undefined) ?? null,
        },
        dateKey,
      );
    }

    case "stat-guesser": {
      return buildStatGuesserShareText(
        {
          avgError: Number(result.avgError ?? 0),
          anchorName: String(result.anchorName ?? "—"),
          targetName: String(result.targetName ?? "—"),
        },
        dateKey,
      );
    }
  }
}

/* ---------- component ---------- */

export function ShareCard({ game, result, dateKey }: ShareCardProps) {
  const text = useMemo(() => buildShareText(game, result, dateKey), [game, result, dateKey]);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShareError(null);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Copy failed — try selecting the text.");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled — silent.
      }
      return;
    }
    await handleCopy();
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 bg-cream-ghost p-5 rounded-2xl border border-border">
      <pre className="font-mono text-sm leading-relaxed text-cream whitespace-pre overflow-x-auto m-0">
        {text}
      </pre>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="cta-secondary flex-1"
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="cta-secondary flex-1"
        >
          Share
        </button>
      </div>

      {shareError && (
        <p className="text-xxs text-incorrect text-center" role="alert">
          {shareError}
        </p>
      )}
    </div>
  );
}
