export interface BudgetCountry {
  iso3: string;
  value: number; // raw metric value
  trueShare: number; // 0-100, integers summing to exactly 100
}

export interface BudgetConfig {
  metricSlug: string;
  metricLabel: string;
  metricClarifier?: string;
  unit: string;
  total: number;
  countries: BudgetCountry[]; // exactly 5
  baseError: number; // total abs error of the even-split (20 each) baseline
  tokens: number; // 100
  mode: "daily" | "practice";
  dateKey: string;
}

export interface BudgetState {
  config: BudgetConfig;
  allocation: number[]; // 5 token counts, each >= 0, sum <= tokens
  phase: "playing" | "results";
}

export type BudgetGrade = "perfect" | "excellent" | "great" | "good" | "okay" | "poor";

export interface BudgetResult {
  accuracy: number; // 0-100, baseline-relative (even split = 0, perfect = 100)
  totalError: number;
  baseError: number;
  perError: number[];
  allocation: number[];
  trueShares: number[];
  grade: BudgetGrade;
  stars: number;
}
