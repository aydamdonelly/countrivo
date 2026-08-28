import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

export interface DraftGameConfig {
  countries: Country[];
  categories: Category[];
  costMatrix: number[][];        // costMatrix[countryIdx][categoryIdx] = rank
  optimalScore: number;
  optimalAssignment: number[];   // optimalAssignment[countryIdx] = categoryIdx
  mode: "daily" | "practice";
  dateKey: string;
}

export interface DraftGameState {
  config: DraftGameConfig;
  currentStep: number;           // 0-7
  assignments: (number | null)[]; // assignments[countryIdx] = categoryIdx or null
  usedCategories: Set<number>;
  phase: "playing" | "results";
  /** Each run gets exactly ONE undo of the last pick. */
  undoUsed: boolean;
}

export interface DraftAssignment {
  countryIdx: number;
  categoryIdx: number;
  rank: number;
}

export interface DraftResult {
  playerScore: number;
  optimalScore: number;
  gap: number;
  grade: "perfect" | "excellent" | "great" | "good" | "okay" | "poor";
  stars: number;
  assignments: DraftAssignment[];
  optimalAssignments: DraftAssignment[];
}
