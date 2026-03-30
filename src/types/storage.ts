import type { GameResult } from "./game";

export interface DailyProgress {
  [gameSlug: string]: {
    [dateKey: string]: {
      completed: boolean;
      result: GameResult | null;
    };
  };
}

export interface UserStats {
  totalGamesPlayed: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  gameStats: {
    [gameSlug: string]: {
      played: number;
      bestScore: number;
      averageScore: number;
    };
  };
}
