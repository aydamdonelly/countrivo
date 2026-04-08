"use client";

import { DailyPlayedMessage } from "@/components/game/daily-lockout-guard";
import type { ServerGameRun } from "@/types/server";

interface DailyAlreadyPlayedProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  run: ServerGameRun;
  totalPlayersToday?: number;
}

export function DailyAlreadyPlayed({
  gameSlug, gameEmoji, gameTitle, run, totalPlayersToday,
}: DailyAlreadyPlayedProps) {
  return (
    <DailyPlayedMessage
      gameSlug={gameSlug}
      gameEmoji={gameEmoji}
      gameTitle={gameTitle}
      scoreDisplay={run.scoreDisplay || `${run.scoreRaw}`}
      rankDaily={run.rankDaily}
      percentile={run.percentile}
      totalPlayersToday={totalPlayersToday}
    />
  );
}
