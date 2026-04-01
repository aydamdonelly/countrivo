"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { getStorageItem } from "@/lib/storage";
import { getAllGames } from "@/lib/data/games";

function getHoursUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
  ));
  return Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
}

function computeLocalStreak(): number {
  if (typeof window === "undefined") return 0;
  const games = getAllGames();
  const dailyGames = games.filter((g) => g.availableModes.includes("daily"));
  let streak = 0;
  const today = new Date();
  for (let d = 0; d < 365; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().slice(0, 10);
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
  const dateKey = new Date().toISOString().slice(0, 10);
  return games.filter((g) =>
    g.availableModes.includes("daily") &&
    getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false)
  ).length;
}

interface DailyHeroProps {
  flagshipRoute: string;
  flagshipSlug?: string;
  /** Pre-fetched from server: whether user already played the flagship daily today */
  serverPlayedToday?: boolean;
  /** Pre-fetched from server: user's current streak (null = guest/no data) */
  serverStreak?: number | null;
}

export function DailyHero({
  flagshipRoute,
  serverPlayedToday = false,
  serverStreak = null,
}: DailyHeroProps) {
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [mounted, setMounted] = useState(false);

  const playedFlagship = serverPlayedToday;

  useEffect(() => {
    // Use server streak if available, otherwise compute from localStorage
    if (serverStreak != null) {
      setStreak(serverStreak);
    } else {
      setStreak(computeLocalStreak());
    }
    setCompleted(countTodayCompleted());
    setHoursLeft(getHoursUntilReset());
    setMounted(true);
  }, [serverStreak]);

  const totalDaily = 11;

  return (
    <section className="text-center py-8 sm:py-10">
      {/* Date + reset timer */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <time className="text-xs font-bold uppercase tracking-widest text-cream-muted">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </time>
        {mounted && hoursLeft > 0 && (
          <span className="text-[10px] text-cream-muted px-2 py-0.5 rounded-full bg-black/5">
            Resets in {hoursLeft}h
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
        {playedFlagship ? "You\u2019ve played today." : "Today\u2019s challenge is live."}
      </h1>
      <p className="mt-3 text-base sm:text-lg text-cream-muted max-w-md mx-auto">
        {playedFlagship
          ? "Check your rank, practice, or try another daily game."
          : "Same puzzle for every player. One attempt. Prove what you know."}
      </p>

      {/* Primary CTA */}
      <Link
        href={playedFlagship ? `${flagshipRoute}` : `${flagshipRoute}/play?mode=daily`}
        className="cta-primary mt-6 text-lg sm:text-xl px-10 py-4"
      >
        {playedFlagship ? "View your result" : "Play today\u2019s challenge"}
        <IconArrowRight width={20} height={20} />
      </Link>

      {/* Live status row */}
      {mounted && (
        <div className="flex items-center justify-center gap-5 sm:gap-8 mt-6 text-sm">
          {streak > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="font-bold text-gold">{streak}-day streak</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-base">✅</span>
            <span className="font-medium text-cream-muted">
              {completed}/{totalDaily} today
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🌍</span>
            <span className="font-medium text-cream-muted">243 countries</span>
          </div>
        </div>
      )}
    </section>
  );
}
