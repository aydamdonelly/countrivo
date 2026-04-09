import type { Country } from "@/types/country";

export const COUNTRYLE_CATEGORIES = [
  "population",
  "area-km2",
  "gdp-per-capita",
  "life-expectancy",
  "internet-users-pct",
  "fertility-rate",
] as const;

export type CountryleCategory = (typeof COUNTRYLE_CATEGORIES)[number];

export interface CountryleCategoryResult {
  category: CountryleCategory;
  guessedValue: number | null;
  direction: "higher" | "lower" | "match" | "unknown";
}

export interface CountryleGuessRow {
  country: Country;
  comparisons: CountryleCategoryResult[];
  continentMatch: boolean;
  isCorrect: boolean;
}

export interface CountryleState {
  target: Country;
  targetStats: Record<string, number>;
  guesses: CountryleGuessRow[];
  phase: "playing" | "won" | "lost";
  maxGuesses: 6;
}
