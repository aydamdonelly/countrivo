/*
 * Stat Guesser (blueprint 8.8): a country and a stat, five rounds, the score is the average
 * percentage error. The engine (src/lib/game-logic/stat-guesser/engine.ts) is untouched; this
 * adapter only wraps it, so the daily board created from `dateSeed(dateKey + edition)` is the
 * exact board `validateStatGuesserResult` rebuilds on the server.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { createStatGuesser, nextRound, submitGuess, type StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { buildStatGuesserShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type GuesserAction = { t: "guess"; v: number } | { t: "next" };

/** Five rounds, daily and practice alike (understand.json engines.stat-guesser). */
export const GUESSER_ROUNDS = 5;

export type ErrorTone = "good" | "neutral" | "bad";

/** The mean per-round error, to one decimal, over every round of the board. */
export function avgError(s: StatGuesserState): number {
  const total = s.scores.reduce<number>((sum, x) => sum + (x ?? 0), 0);
  return Math.round((total / s.rounds.length) * 10) / 10;
}

/**
 * A percentage error has no ceiling: guess 5M for an urban share of 95 and it runs to seven
 * figures. The score floors at zero the moment the average passes 100, so 100 is where the
 * scale ends: every error is shown bounded by it, which keeps the numbers readable and the
 * two server validators in agreement (they floor the score the same way). The exact tenths
 * stay in `scores` and in the saved run.
 */
export const MAX_SHOWN_ERROR = 100;

/** `17.5`, and `100` for anything at or past the end of the scale. */
export function errorText(e: number): string {
  return e >= MAX_SHOWN_ERROR ? String(MAX_SHOWN_ERROR) : String(e);
}

/** The average as it is reported and scored, bounded the same way. */
export function reportedError(s: StatGuesserState): number {
  return Math.min(avgError(s), MAX_SHOWN_ERROR);
}

/** ink under 20, mute under 50, ember otherwise (blueprint 8.8). */
export function errorTone(e: number): ErrorTone {
  return e < 20 ? "good" : e < 50 ? "neutral" : "bad";
}

/** The one-word grade on the result head, in the voice of the old score line. */
export function gradeWord(avg: number): string {
  return avg < 20 ? "Sharp." : avg < 50 ? "Good read." : "Hard stats.";
}

/** The verdict line under the board: the worded read, the number sits on the board itself. */
const VERDICT_TEXT: Record<ErrorTone, string> = { good: "Sharp.", neutral: "Not bad.", bad: "Way off." };

/** round(max(0, 100 - avgError)), the scored value on the board. */
function scoreOf(avg: number): number {
  return Math.round(Math.max(0, 100 - avg));
}

export const gameModule: GameModule<StatGuesserState, GuesserAction> = {
  slug: "stat-guesser",
  create(seed) {
    return createStatGuesser(mulberry32(seed), GUESSER_ROUNDS);
  },
  reduce(s, a) {
    if (a.t === "guess") return s.phase === "playing" && Number.isFinite(a.v) ? submitGuess(s, a.v) : s;
    if (a.t === "next") return nextRound(s);
    return s;
  },
  codec,
  done: (s) => s.phase === "results",
  progress(s) {
    const total = s.rounds.length;
    const guessed = s.currentRound + (s.phase === "playing" ? 0 : 1);
    return {
      done: Math.min(guessed, total),
      total,
      label: "round",
      value: `${Math.min(s.currentRound + 1, total)} of ${total}`,
      // Reading the answer to round 1 is still round 1: with the default the ember pip would
      // run ahead to round 2 while the line beside it still said `round 1 of 5`. In feedback
      // the round is answered, so no pip is current until the next one opens.
      current: s.phase === "playing" ? undefined : null,
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "guess" || next === prev) return null;
    const tone = errorTone(next.scores[next.currentRound] ?? 0);
    return { tone, text: VERDICT_TEXT[tone] };
  },
  payload(s, ctx) {
    const avg = reportedError(s);
    const scores = s.scores.map((x) => x ?? 0);
    const targetIso3s = s.rounds.map((r) => r.country.iso3);
    return {
      gameSlug: "stat-guesser",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: scoreOf(avg),
      scoreMax: 100,
      scoreSortValue: scoreOf(avg),
      scoreDisplay: `${avg}% avg error`,
      resultJson: {
        avgError: avg,
        totalError: Math.round(scores.reduce((sum, x) => sum + x, 0) * 10) / 10,
        scores,
        guesses: s.guesses.map((x) => x ?? 0),
        rounds: s.rounds.length,
        targetIso3s,
        targetIso3: targetIso3s[0],
      },
      startedAt: ctx.startedAt,
    };
  },
  // A whole number, so the 56 px Erode score counts up cleanly and the rows keep the exact
  // tenths. `18 % avg error` wraps onto a second 56 px line at 350 px of content and reads
  // as broken, so the card carries the compact `18 % off` and the result head under it
  // spells the average out (blueprint 3.24 asks the card for a compact score).
  scoreLabel: (s) => `${Math.round(reportedError(s))} % off`,
  share: (s, ctx) => buildStatGuesserShareText({ avgError: reportedError(s) }, ctx.dateKey),
  keys(s, dispatch): Record<string, () => void> {
    return s.phase === "feedback" ? { Enter: () => dispatch({ t: "next" }) } : {};
  },
  keyHint: "Enter submits and advances",
  keepBoardOnResult: false,
  submits: true,
};
