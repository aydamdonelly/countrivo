import type { ProgressInfo } from "./types";
import type { Mode } from "@/ui/types";

export type QuickSlug = "higher-or-lower" | "flag-quiz" | "stat-guesser";
/** `start` and `finish` belong to the Flag Quiz sprint: the server stamps their time on receipt. */
export type QuickAction = { t: "guess"; c: "higher" | "lower" } | { t: "answer"; i: number } | { t: "lock"; i: number } | { t: "next" } | { t: "start" } | { t: "finish" };
export interface QuickHistory {
  label: string; guess: string; answer: string; points: number; correct: boolean;
  /** A full sentence for the recap row in place of `guess > answer`. */
  note?: string;
  /** Three states where partial credit exists (Stat Guesser): close, near, far. */
  tone?: "right" | "near" | "wrong";
  /** The round counted double. */
  doubled?: boolean;
}
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
  /** The question before the call, with the reference value. */
  question: string;
  source: string;
  doubled: boolean;
}
/** The ten-flag quiz (frozen boards from before the sprint, and Europe flags practice). */
export interface FlagQuickView extends QuickBase {
  kind: "flag-quiz";
  format?: "quiz";
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
/** One flag the sprint showed, for the result list. Only sent once the run is over. */
export interface FlagSprintSeen {
  iso2: string;
  name: string;
  /** The picked name; null for the flag the clock ran out on. */
  guess: string | null;
  correct: boolean;
}

/**
 * The Flag Quiz sprint. While the clock runs the view carries only the flag on screen and its
 * four names: never a later flag, never the right answer. `deadline` and `serverNow` are server
 * epoch ms, so the client counts down from the server clock rather than its own.
 */
export interface FlagSprintView extends QuickBase {
  kind: "flag-quiz";
  format: "sprint";
  stage: "ready" | "running" | "finished";
  /** The opaque flag on screen; null before the start and after the end. */
  flagSrc: string | null;
  options: string[];
  correct: number;
  wrong: number;
  seconds: number;
  penaltySeconds: number;
  target: number;
  deadline: number | null;
  serverNow: number;
  /** The previous answer: right or wrong, and the right name. */
  last: { correct: boolean; answer: string } | null;
  seen: FlagSprintSeen[];
}
export type QuickView = HigherQuickView | FlagQuickView | FlagSprintView | StatQuickView;

export function isFlagSprint(view: QuickView): view is FlagSprintView {
  return view.kind === "flag-quiz" && view.format === "sprint";
}
