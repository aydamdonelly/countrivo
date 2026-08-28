"use client";

import { useEffect, useRef, useState } from "react";
import { getStorageItem } from "@/lib/storage";
import { getAllGames } from "@/lib/data/registry";
import { useAuth } from "@/components/auth/auth-provider";
import { Flame } from "@/components/home/flame";

function computeLocalStreak(): number {
  if (typeof window === "undefined") return 0;
  const dailyGames = getAllGames().filter((g) => g.availableModes.includes("daily"));
  let streak = 0;
  const today = new Date();
  for (let d = 0; d < 365; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateKey = date.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
    const completedAny = dailyGames.some((g) => getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false));
    if (completedAny) streak++;
    else if (d > 0) break;
  }
  return streak;
}

/** The burning flame plus the streak count. Server streak when signed in, local otherwise. */
export function StreakBadge() {
  const { profile } = useAuth();
  const [local, setLocal] = useState(0);
  const [pulse, setPulse] = useState(false);
  const lastSeen = useRef<number | null>(null);
  const streak = Math.max(profile?.streakCurrent ?? 0, local);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setLocal(computeLocalStreak());
  }, []);

  useEffect(() => {
    const prev = lastSeen.current;
    lastSeen.current = streak;
    if (prev !== null && streak > prev) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pulse animation flag scoped to a timeout
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(id);
    }
  }, [streak]);

  return (
    <span className={`inline-flex items-center gap-1 text-cream ${pulse ? "streak-incremented" : ""}`} title={`${streak} day streak`}>
      <Flame size={18} className={streak > 0 ? "text-gold" : "text-cream-dim"} />
      <b className="text-sm font-semibold tabular-nums">{streak}</b>
    </span>
  );
}
