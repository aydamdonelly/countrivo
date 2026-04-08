"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { getDailyLockout } from "@/lib/storage";
import { getTodayDateKey, msUntilReset, formatTimeUntilReset } from "@/lib/daily-seed";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DailyLockoutGuardProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  children: React.ReactNode;
}

/* ---------- Shared "already played" UI ---------- */

interface DailyPlayedMessageProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  scoreDisplay: string;
  rankDaily?: number | null;
  percentile?: number | null;
  totalPlayersToday?: number;
  showSignInHint?: boolean;
}

export function DailyPlayedMessage({
  gameSlug, gameEmoji, gameTitle, scoreDisplay,
  rankDaily, percentile, totalPlayersToday, showSignInHint,
}: DailyPlayedMessageProps) {
  const timeLeft = formatTimeUntilReset(msUntilReset());
  return (
    <div className="flex flex-col items-center gap-6 py-12 sm:py-16 text-center max-w-md mx-auto">
      <div className="text-5xl">{gameEmoji}</div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">Already played today</h2>
        <p className="text-sm text-cream-muted mt-1.5">
          You completed today&apos;s {gameTitle} daily challenge.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
          <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">Score</div>
          <div className="text-2xl font-extrabold font-mono text-gold">{scoreDisplay}</div>
        </div>
        {rankDaily != null && (
          <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
            <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">Rank today</div>
            <div className="text-2xl font-extrabold font-mono">
              #{rankDaily}
              {totalPlayersToday != null && totalPlayersToday > 0 && (
                <span className="text-sm text-cream-muted font-normal"> / {totalPlayersToday}</span>
              )}
            </div>
          </div>
        )}
        {percentile != null && (
          <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
            <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">Better than</div>
            <div className="text-2xl font-extrabold font-mono">{Math.round(percentile)}%</div>
          </div>
        )}
      </div>
      <p className="text-sm text-cream-muted">
        Next daily challenge in <span className="font-bold text-cream">{timeLeft}</span>
      </p>
      {showSignInHint && (
        <p className="text-xs text-cream-muted">Sign in to save your score and see your rank.</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link href={`/games/${gameSlug}/play?mode=practice`} className="cta-primary flex-1">Practice unlimited</Link>
        <Link href={`/games/${gameSlug}/leaderboard`} className="cta-secondary flex-1">View leaderboard</Link>
      </div>
    </div>
  );
}

/* ---------- Guard component ---------- */

export function DailyLockoutGuard({ gameSlug, gameEmoji, gameTitle, children }: DailyLockoutGuardProps) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [lockoutData, setLockoutData] = useState<{ score: string; scoreDisplay: string } | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (loading && !timedOut) return;
    if (user) return;
    const entry = getDailyLockout(gameSlug, getTodayDateKey());
    if (entry) {
      setLocked(true);
      setLockoutData({ score: entry.score, scoreDisplay: entry.scoreDisplay });
    }
  }, [loading, timedOut, user, gameSlug]);

  if (loading && !timedOut) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;
  }

  if (locked && lockoutData) {
    return (
      <DailyPlayedMessage
        gameSlug={gameSlug}
        gameEmoji={gameEmoji}
        gameTitle={gameTitle}
        scoreDisplay={lockoutData.scoreDisplay}
        showSignInHint
      />
    );
  }

  return <>{children}</>;
}
