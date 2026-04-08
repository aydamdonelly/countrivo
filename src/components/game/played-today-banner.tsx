"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { checkDailyStatus } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getDailyLockout } from "@/lib/storage";
import type { ServerGameRun } from "@/types/server";

interface PlayedTodayBannerProps {
  gameSlug: string;
  playHref: string;
}

export function PlayedTodayBanner({ gameSlug, playHref }: PlayedTodayBannerProps) {
  const { user, loading } = useAuth();
  const [run, setRun] = useState<ServerGameRun | null>(null);
  const [localScore, setLocalScore] = useState<string | null>(null);

  useEffect(() => {
    const entry = getDailyLockout(gameSlug, getTodayDateKey());
    if (entry) setLocalScore(entry.scoreDisplay);
  }, [gameSlug]);

  useEffect(() => {
    if (loading || !user) return;
    checkDailyStatus(gameSlug, getTodayDateKey()).then((result) => {
      if (result.played && result.run) setRun(result.run);
    });
  }, [user, loading, gameSlug]);

  if (!run && !localScore) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gold-dim border border-gold/20 mb-4 animate-in">
      <span className="text-sm font-bold text-gold">Played today</span>
      <span className="text-sm text-cream">
        {run?.scoreDisplay ?? localScore}
      </span>
      {run?.rankDaily != null && (
        <span className="text-sm text-cream-muted">
          Rank <span className="font-bold text-cream">#{run.rankDaily}</span>
        </span>
      )}
      {run?.percentile != null && (
        <span className="text-sm text-cream-muted">
          Better than <span className="font-bold text-cream">{Math.round(run.percentile)}%</span>
        </span>
      )}
      <Link
        href={`${playHref}?mode=practice`}
        className="ml-auto text-xs font-bold text-gold hover:underline"
      >
        Practice →
      </Link>
    </div>
  );
}
