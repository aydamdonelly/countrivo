export type ClusterDifficulty = "easy" | "medium" | "hard" | "purple";

export interface ClusterGroup {
  theme: string;
  difficulty: ClusterDifficulty;
  countryIso3s: string[]; // exactly 4
}

export interface ClusterPuzzle {
  date: string; // YYYY-MM-DD
  groups: ClusterGroup[]; // exactly 4 — one per difficulty
  editorial?: string;
}

export interface ClusterAttempt {
  iso3s: string[];
  correct: boolean;
  nearMiss: boolean; // true if 3 of 4 matched a real group
  matchedTheme?: string; // populated when correct
}

export interface ClusterState {
  phase: "playing" | "finished";
  puzzle: ClusterPuzzle;
  shuffledCells: string[]; // 16 ISO3s
  selected: string[]; // up to 4
  solvedGroups: ClusterGroup[];
  attemptsLeft: number; // start 4
  attempts: ClusterAttempt[];
  won: boolean;
}
