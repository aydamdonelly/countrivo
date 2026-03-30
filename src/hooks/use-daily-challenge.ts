"use client";
import { useState, useEffect, useCallback } from "react";
import { getTodayDateKey } from "@/lib/daily-seed";
import { isDailyCompleted, saveDailyResult, getDailyResult } from "@/lib/storage";
import type { GameResult } from "@/types/game";

export function useDailyChallenge(gameSlug: string) {
  const dateKey = getTodayDateKey();
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    setCompleted(isDailyCompleted(gameSlug, dateKey));
    setResult(getDailyResult<GameResult>(gameSlug, dateKey));
  }, [gameSlug, dateKey]);

  const markCompleted = useCallback((r: GameResult) => {
    saveDailyResult(gameSlug, dateKey, r);
    setCompleted(true);
    setResult(r);
  }, [gameSlug, dateKey]);

  return { dateKey, isCompleted: completed, result, markCompleted };
}
