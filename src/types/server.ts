export interface ServerGameRun {
  challengeUrl?: string;
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
  placeCountry?: string | null;
  moderationHidden?: boolean;
  dailyNameCount?: number;
  /** Hypothetical standing among real published scores, including this private result once. */
  rankPreview?: { rank: number; playerCount: number };
  /** Small, public score window. Private names and game answers never enter these rows. */
  leaderboard?: { available: boolean; entries: ResultLeaderboardEntry[]; playerCount: number; gameSlug?: string; dateKey?: string; gapBeforeYou?: boolean };
}

export interface ResultLeaderboardEntry {
  runId: number;
  displayName: string;
  scoreDisplay: string;
  scoreSortValue: number;
  rank: number;
}

export interface LeaderboardEntry {
  runId: number;
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
  countryCode?: string | null;
}

export interface RunDetail {
  runId: number;
  isOwn?: boolean;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gameSlug: string;
  dailyDate: string;
  scoreRaw: number;
  scoreMax: number;
  scoreDisplay: string;
  scoreSortValue: number;
  rankDaily: number | null;
  percentile: number | null;
  resultJson: Record<string, unknown> | null;
  seed: number | null;
  completedAt: string;
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
