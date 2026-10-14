import type { ProgressInfo } from "./types";
import type { Mode } from "@/ui/types";

export type QuickSlug = "higher-or-lower" | "flag-quiz" | "stat-guesser";
export type QuickAction = { t: "guess"; c: "higher" | "lower" } | { t: "answer"; i: number } | { t: "lock"; i: number } | { t: "next" };
export interface QuickHistory { label: string; guess: string; answer: string; points: number; correct: boolean }
export interface QuickBase {
  kind: QuickSlug;
  mode: Mode;
  phase: "playing" | "reveal" | "finished";
  round: number;
  total: number;
  score: string;
  progress: ProgressInfo;
  shareText: string;
  history: QuickHistory[];
  /** Only the next unanswered challenge; never an unconfirmed result. */
  nextView?: QuickView;
}
export interface QuickCountry { name: string; iso2: string; value: string | null }
export interface HigherQuickView extends QuickBase {
  kind: "higher-or-lower";
  left: QuickCountry;
  right: QuickCountry;
  stat: string;
  unit: string;
  chosen: "higher" | "lower" | null;
  correct: boolean | null;
  comparison: string | null;
  source: string;
  doubled: boolean;
}
export interface FlagQuickView extends QuickBase {
  kind: "flag-quiz";
  flagSrc: string;
  options: string[];
  picked: number | null;
  correctIndex: number | null;
  fact: string | null;
  source: string | null;
  doubled: boolean;
}
export interface StatQuickView extends QuickBase {
  kind: "stat-guesser";
  country: { name: string; iso2: string };
  stat: string;
  unit: string;
  ruler: { min: number; max: number; steps: number[]; coarse: number[]; kind: "magnitude" | "percent" };
  refs: { name: string; iso2: string; value: number }[];
  actualValue: number | null;
  guessValue: number | null;
  points: number | null;
  context: string | null;
  gap: string | null;
  doubled: boolean;
}
export type QuickView = HigherQuickView | FlagQuickView | StatQuickView;
