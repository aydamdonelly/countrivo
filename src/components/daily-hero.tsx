"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { getStorageItem } from "@/lib/storage";
import { getAllGames } from "@/lib/data/registry";
import { getTodayDateKey } from "@/lib/daily-seed";
import { useResetCountdown } from "@/hooks/use-reset-countdown";

function computeLocalStreak(): number {
  if (typeof window === "undefined") return 0;
  const games = getAllGames();
  const dailyGames = games.filter((g) => g.availableModes.includes("daily"));
  let streak = 0;
  const today = new Date();
  for (let d = 0; d < 365; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
    const completedAny = dailyGames.some((g) =>
      getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false)
    );
    if (completedAny) {
      streak++;
    } else if (d > 0) {
      break;
    }
  }
  return streak;
}

function countTodayCompleted(): number {
  if (typeof window === "undefined") return 0;
  const games = getAllGames();
  const dateKey = getTodayDateKey();
  return games.filter((g) =>
    g.availableModes.includes("daily") &&
    getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false)
  ).length;
}

interface DailyHeroProps {
  flagshipRoute: string;
  flagshipSlug?: string;
  serverPlayedToday?: boolean;
  serverStreak?: number | null;
}

function getNextUnplayedRoute(): string | null {
  if (typeof window === "undefined") return null;
  const games = getAllGames();
  const dailyGames = games.filter((g) => g.availableModes.includes("daily"));
  const dateKey = getTodayDateKey();
  for (const g of dailyGames) {
    const played = getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false);
    if (!played) return `${g.route}/play?mode=daily`;
  }
  return null;
}

export function DailyHero({
  flagshipRoute,
  serverPlayedToday = false,
  serverStreak = null,
}: DailyHeroProps) {
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  // Live ticking HH:MM:SS until the real Berlin-midnight reset.
  const resetCountdown = useResetCountdown();

  const playedFlagship = serverPlayedToday;
  const totalDaily = 9;

  useEffect(() => {
    // Hydrating from localStorage / props that are only available client-side.
    // The setState batch keeps this to a single render pass.
    if (serverStreak != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external-system hydration on mount
      setStreak(serverStreak);
    } else {
      setStreak(computeLocalStreak());
    }
    setCompleted(countTodayCompleted());
    setNextRoute(getNextUnplayedRoute());
    setMounted(true);
  }, [serverStreak]);

  const progressPct = totalDaily > 0 ? (completed / totalDaily) * 100 : 0;
  const allDone = completed >= totalDaily;
  // Calm, ignorable streak-keep nudge: only when there's a live streak AND
  // today's daily set hasn't been touched yet. No guilt, no urgency.
  const showStreakNudge = mounted && streak > 0 && completed === 0 && !allDone;

  return (
    <section className="text-center py-8 sm:py-12">
      {/* Date · month-day · reset countdown */}
      <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
        <p className="text-sm font-mono text-cream-muted tabular-nums">
          <span>
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </span>
          <span className="text-gold mx-1.5">·</span>
          <span>
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </span>
          {resetCountdown && (
            <>
              <span className="text-gold mx-1.5">·</span>
              <span className="tabular-nums">Resets in {resetCountdown}</span>
            </>
          )}
        </p>
        <span className="flex items-center gap-1.5 text-xxs text-cream-muted px-2.5 py-0.5 rounded-full bg-black/5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
        {allDone
          ? "You cleared today."
          : streak >= 30
            ? `${streak}-day streak. Legend.`
            : streak >= 14
              ? `${streak} days strong.`
              : streak >= 7
                ? `${streak}-day streak!`
                : playedFlagship
                  ? "Keep going."
                  : "Today\u2019s challenge is live."}
      </h1>
      <p className="mt-3 text-base sm:text-lg text-cream-muted max-w-lg mx-auto">
        {allDone
          ? "Every daily game completed. Come back tomorrow for a fresh set."
          : playedFlagship
            ? `${totalDaily - completed} daily game${totalDaily - completed !== 1 ? "s" : ""} left. Same puzzle for everyone. One shot each.`
            : "Same puzzle for every player. One attempt. Prove what you know."}
      </p>

      {/* Calm streak-keep nudge — celebratory, no guilt, trivially ignorable */}
      {showStreakNudge && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
          <span aria-hidden="true">🔥</span>
          Play today to keep your {streak}-day streak
        </p>
      )}

      {/* Primary CTA */}
      <Link
        href={allDone
          ? "/games"
          : nextRoute ?? (playedFlagship ? "/games" : `${flagshipRoute}/play?mode=daily`)}
        className="cta-primary mt-6 text-lg sm:text-xl px-10 py-4"
      >
        {allDone
          ? "Practice any game"
          : playedFlagship
            ? "Play next daily game"
            : "Play today\u2019s challenge"}
        <IconArrowRight width={20} height={20} />
      </Link>

      {/* Daily progress bar */}
      {mounted && (
        <div className="mt-8 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-bold text-cream">
              {completed}/{totalDaily} completed
            </span>
            {resetCountdown ? (
              <span className="text-cream-muted font-mono tabular-nums">
                Resets in {resetCountdown}
              </span>
            ) : null}
          </div>
          <div className={`h-2 bg-black/5 rounded-full overflow-hidden ${allDone ? "score-pop" : ""}`}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(progressPct, 2)}%`,
                backgroundColor: allDone ? "#16a34a" : "#b8860b",
              }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      {mounted && (
        <div className="flex items-center justify-center gap-5 sm:gap-8 mt-5 text-sm">
          {streak > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="font-bold text-gold font-mono">
                {streak}<span className="text-gold mx-1">·</span>day<span className="text-gold mx-1">·</span>streak
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-base">🌍</span>
            <span className="font-medium text-cream-muted">243 countries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🎮</span>
            <span className="font-medium text-cream-muted">14 games</span>
          </div>
        </div>
      )}
    </section>
  );
}
