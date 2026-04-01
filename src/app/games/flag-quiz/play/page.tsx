"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GameShell } from "@/components/game/game-shell";
import { FlagQuizBoard } from "@/components/games/flag-quiz/flag-quiz-board";
import { DailyAlreadyPlayed } from "@/components/game/daily-already-played";
import { useAuth } from "@/components/auth/auth-provider";
import { checkDailyStatus, getDailySummary } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { ServerGameRun } from "@/types/server";

function Content() {
  const params = useSearchParams();
  const mode = params.get("mode") === "daily" ? "daily" : "practice";
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
      checkDailyStatus("flag-quiz", dateKey),
      getDailySummary("flag-quiz", dateKey),
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
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🏁</div>
        <p className="text-cream-muted">Checking your daily status...</p>
      </div>
    );
  }

  if (dailyRun) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyAlreadyPlayed
          gameSlug="flag-quiz"
          gameEmoji="🏁"
          gameTitle="Flag Quiz"
          run={dailyRun}
          totalPlayersToday={totalPlayers}
        />
      </div>
    );
  }

  return (
    <GameShell title="Flag Quiz" backHref="/games/flag-quiz" mode={mode}>
      <FlagQuizBoard mode={mode} />
    </GameShell>
  );
}

export default function FlagQuizPlayPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-cream-muted">Loading...</div>}>
      <Content />
    </Suspense>
  );
}
