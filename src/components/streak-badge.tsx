"use client";

import { useEffect, useState } from "react";
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

export function StreakBadge() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(computeStreak());
  }, []);

  if (streak === 0) return null;

  return (
    <span className="streak-badge text-sm" title={`${streak}-day streak`}>
      <span>🔥</span>
      <span>{streak}</span>
    </span>
  );
}
