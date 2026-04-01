"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { DraftBoard } from "@/components/games/country-draft/draft-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { useAuth } from "@/components/auth/auth-provider";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { ServerGameRun } from "@/types/server";

function DraftPlayContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "daily" ? "daily" : "practice";
  const { user, loading: authLoading } = useAuth();
  const [dailyRun, setDailyRun] = useState<ServerGameRun | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number | undefined>(undefined);
  const [checking, setChecking] = useState(mode === "daily");

  useEffect(() => {
    if (mode !== "daily" || authLoading) return;

    if (!user) {
      setChecking(false);
      return;
    }

    const dateKey = getTodayDateKey();
    Promise.all([
      checkDailyStatus("country-draft", dateKey),
      getDailySummary("country-draft", dateKey),
    ]).then(([status, summary]) => {
      if (status.played && status.run) {
        setDailyRun(status.run);
        setTotalPlayers(summary.playerCount);
      }
      setChecking(false);
    });
  }, [mode, user, authLoading]);

  if (checking) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">🎯</div>
        <p className="text-cream-muted">Checking your daily status...</p>
      </div>
    );
  }

  if (dailyRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyAlreadyPlayed
          gameSlug="country-draft"
          gameEmoji="🎯"
          gameTitle="Country Draft"
          run={dailyRun}
          totalPlayersToday={totalPlayers}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/games/country-draft"
          className="text-base font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className={`text-base font-bold uppercase tracking-wider ${
            mode === "daily" ? "text-gold" : "text-cream-muted"
          }`}>
            {mode === "daily" ? "Daily Challenge" : "Practice"}
          </span>
        </div>
      </div>

      <DraftBoard mode={mode} />
    </div>
  );
}

export default function DraftPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-6xl mb-6 animate-pulse">🎯</div>
          <p className="text-xl text-cream-muted">Setting up your game...</p>
        </div>
      }
    >
      <DraftPlayContent />
    </Suspense>
  );
}
