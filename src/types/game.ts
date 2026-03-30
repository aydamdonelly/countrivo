export type GameMode = "daily" | "practice" | "archive" | "custom";

export interface GameMeta {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
  category: "quiz" | "ranking" | "strategy" | "speed" | "knowledge";
  isNew: boolean;
  isFlagship: boolean;
  availableModes: GameMode[];
  route: string;
}

export interface GameResult {
  gameSlug: string;
  mode: GameMode;
  score: number;
  maxScore: number;
  optimalScore?: number;
  dateKey: string;
  timestamp: number;
  details: Record<string, unknown>;
}
