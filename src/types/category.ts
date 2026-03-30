export type StatDirection = "higher_is_better" | "lower_is_better" | "neutral";

export interface Category {
  slug: string;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  direction: StatDirection;
  source: string;
  sourceYear: number;
  coveragePercent: number;
  emoji: string;
}
