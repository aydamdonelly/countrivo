export interface ServerGameRun {
  id: number;
  gameSlug: string;
  mode: string;
  dailyDate: string | null;
  scoreRaw: number;
  scoreMax: number;
  scoreDisplay: string;
  scoreSortValue: number;
  scoreNormalized: number;
  rankDaily: number | null;
  percentile: number | null;
  isPersonalBest: boolean;
  resultJson: Record<string, unknown>;
  completedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  scoreRaw: number;
  scoreMax: number;
  scoreDisplay: string;
  scoreSortValue: number;
  rankDaily: number;
  percentile: number;
}

export interface UserGameStats {
  bestScoreRaw: number;
  bestScoreMax: number;
  bestSortValue: number;
  avgSortValue: number;
  totalRuns: number;
  totalDailyRuns: number;
  lastPlayedAt: string | null;
}

export interface DailySummary {
  playerCount: number;
  avgScore: number;
  topScoreRaw: number | null;
  topScoreDisplay: string | null;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  streakCurrent: number;
  streakLongest: number;
  lastDailyDate: string | null;
  createdAt: string;
}
