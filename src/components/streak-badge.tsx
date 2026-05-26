"use client";

import { useEffect, useRef, useState } from "react";
import { getStorageItem } from "@/lib/storage";
import { getAllGames } from "@/lib/data/games";

function computeStreak(): number {
  if (typeof window === "undefined") return 0;
  const games = getAllGames();
  const dailyGames = games.filter((g) =>
    g.availableModes.includes("daily")
  );

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

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  const [pulse, setPulse] = useState(false);
  const lastSeen = useRef<number | null>(null);

  useEffect(() => {
    // computeStreak reads localStorage which is only available client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setStreak(computeStreak());
  }, []);

  useEffect(() => {
    if (streak === 0) return;
    const prev = lastSeen.current;
    lastSeen.current = streak;
    if (prev !== null && streak > prev) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pulse animation flag scoped to a timeout
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(id);
    }
  }, [streak]);

  if (streak === 0) return null;

  return (
    <span
      className={`streak-badge text-sm font-mono ${pulse ? "streak-incremented" : ""}`}
      title={`${streak} day streak`}
    >
      <span>🔥</span>
      <span>{streak}</span>
      <span className="text-gold mx-0.5">·</span>
      <span>day</span>
    </span>
  );
}
