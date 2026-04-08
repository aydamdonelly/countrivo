"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { getDailyLockout } from "@/lib/storage";
import { getTodayDateKey, msUntilReset } from "@/lib/daily-seed";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DailyLockoutGuardProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  children: React.ReactNode;
}

function formatTimeUntilReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyLockoutGuard({ gameSlug, gameEmoji, gameTitle, children }: DailyLockoutGuardProps) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [lockoutData, setLockoutData] = useState<{ score: string; scoreDisplay: string } | null>(null);

  useEffect(() => {
    if (loading || user) return;
    const entry = getDailyLockout(gameSlug, getTodayDateKey());
    if (entry) {
      setLocked(true);
      setLockoutData({ score: entry.score, scoreDisplay: entry.scoreDisplay });
    }
  }, [loading, user, gameSlug]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;
  }

  if (locked && lockoutData) {
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
        <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
          <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">Score</div>
          <div className="text-2xl font-extrabold font-mono text-gold">{lockoutData.scoreDisplay}</div>
        </div>
        <p className="text-sm text-cream-muted">
          Next daily challenge in <span className="font-bold text-cream">{timeLeft}</span>
        </p>
        <p className="text-xs text-cream-muted">Sign in to save your score and see your rank.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href={`/games/${gameSlug}/play?mode=practice`} className="cta-primary flex-1">Practice unlimited</Link>
          <Link href={`/games/${gameSlug}/leaderboard`} className="cta-secondary flex-1">View leaderboard</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
