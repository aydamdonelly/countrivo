export interface CaravanItem {
  iso3: string;
  value: number; // points = 244 - global rank in the target metric (higher = better)
  price: number; // gold cost (steep/convex in value, with seeded jitter for bargains)
}

export interface CaravanConfig {
  metricSlug: string;
  metricLabel: string;
  metricClarifier?: string;
  items: CaravanItem[]; // exactly 12, stable index order
  budget: number; // gold pool
  buyCount: number; // 5
  optimalValue: number; // max total value of any affordable 5-basket
  optimalBasket: number[]; // item indices of an optimal basket
  mode: "daily" | "practice";
  dateKey: string;
}

export interface CaravanState {
  config: CaravanConfig;
  bought: number[]; // item indices, in purchase order
  goldSpent: number;
  phase: "playing" | "results";
}

export type CaravanGrade = "perfect" | "excellent" | "great" | "good" | "okay" | "poor";

export interface CaravanResult {
  playerValue: number;
  optimalValue: number;
  efficiency: number; // 0-100 = playerValue / optimalValue
  grade: CaravanGrade;
  stars: number;
  bought: number[];
  optimalBasket: number[];
  goldSpent: number;
  budget: number;
}
