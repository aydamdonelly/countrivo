export type StatDirection = "higher_is_better" | "lower_is_better" | "neutral";

export interface Category {
  slug: string;
  label: string;
  shortLabel: string;
  /** Tiny unit/basis clarifier shown under the button text, e.g. "kg per year". */
  clarifier?: string;
  unit: string;
  description: string;
  direction: StatDirection;
  source: string;
  sourceYear: number;
  coveragePercent: number;
}
