"use client";

import Link from "next/link";
import type { ServerGameRun } from "@/types/server";

interface DailyAlreadyPlayedProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  run: ServerGameRun;
  totalPlayersToday?: number;
}

function getMsUntilReset(): number {
  const now = new Date();
  const berlinNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const berlinMidnight = new Date(berlinNow);
  berlinMidnight.setDate(berlinMidnight.getDate() + 1);
  berlinMidnight.setHours(0, 0, 0, 0);
  return Math.max(0, berlinMidnight.getTime() - berlinNow.getTime());
}

function formatTimeUntilReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyAlreadyPlayed({
  gameSlug,
  gameEmoji,
  gameTitle,
  run,
  totalPlayersToday,
}: DailyAlreadyPlayedProps) {
  const timeLeft = formatTimeUntilReset(getMsUntilReset());

  return (
    <div className="flex flex-col items-center gap-6 py-12 sm:py-16 text-center max-w-md mx-auto">
      <div className="text-5xl">{gameEmoji}</div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          Already played today
        </h2>
        <p className="text-sm text-cream-muted mt-1.5">
          You completed today&apos;s {gameTitle} daily challenge.
        </p>
      </div>

      {/* Score summary */}
      <div className="flex items-center gap-4">
        <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
          <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
            Score
          </div>
          <div className="text-2xl font-extrabold font-mono text-gold">
            {run.scoreDisplay || `${run.scoreRaw}`}
          </div>
        </div>

        {run.rankDaily != null && (
          <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
            <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
              Rank today
            </div>
            <div className="text-2xl font-extrabold font-mono">
              #{run.rankDaily}
              {totalPlayersToday != null && totalPlayersToday > 0 && (
                <span className="text-sm text-cream-muted font-normal"> / {totalPlayersToday}</span>
              )}
            </div>
          </div>
        )}

        {run.percentile != null && (
          <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
            <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
              Better than
            </div>
            <div className="text-2xl font-extrabold font-mono">
              {Math.round(run.percentile)}%
            </div>
          </div>
        )}
      </div>

      {/* Reset timer */}
      <p className="text-sm text-cream-muted">
        Next daily challenge in <span className="font-bold text-cream">{timeLeft}</span>
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href={`/games/${gameSlug}/play?mode=practice`}
          className="cta-primary flex-1"
        >
          Practice unlimited
        </Link>
        <Link
          href={`/games/${gameSlug}/leaderboard`}
          className="cta-secondary flex-1"
        >
          View leaderboard
        </Link>
      </div>
    </div>
  );
}
