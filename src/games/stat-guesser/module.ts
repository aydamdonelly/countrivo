/*
 * Stat Guesser (concept 5.6): five rounds, each one country and one stat, guessed by placing a
 * pin on a ruler with two fixed reference countries. Points per round 0 to 100, round 5
 * counts double, 600 is the maximum and 300 is par. The board is built by the engine from
 * the seed and the date key, so the daily board in the first HTML is the one
 * `validateStatGuesserResult` rebuilds on the server.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  MAX_SCORE,
  boardPlan,
  createStatGuesser,
  lockGuess,
  nextRound,
  totalOf,
  type StatGuesserState,
} from "@/lib/game-logic/stat-guesser/engine";
import { buildStatGuesserShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

/** `lock` carries the ruler step index the pin rests on. */
export type GuesserAction = { t: "lock"; i: number } | { t: "next" };

export type PointsTone = "good" | "neutral" | "bad";

/** The share-square bands, reused for the verdict juice and the result rows. */
export function pointsTone(p: number): PointsTone {
  return p >= 80 ? "good" : p >= 50 ? "neutral" : "bad";
}

export function totalScore(s: StatGuesserState): number {
  return totalOf(s.points);
}

export const gameModule: GameModule<StatGuesserState, GuesserAction> = {
  slug: "stat-guesser",
  create(seed, mode, dateKey) {
    return createStatGuesser(mulberry32(seed), boardPlan(seed, mode, dateKey));
  },
  reduce(s, a) {
    if (a.t === "lock") return lockGuess(s, a.i);
    if (a.t === "next") return nextRound(s);
    return s;
  },
  codec,
  done: (s) => s.phase === "results",
  progress(s) {
    return {
      done: s.points.filter((p) => p !== null).length,
      total: s.rounds.length,
      label: "score",
      value: String(totalScore(s)),
      extra: `of ${MAX_SCORE}`,
      // The round on the ruler is current; during its reveal it is answered, so none is.
      current: s.phase === "playing" ? s.currentRound : null,
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "lock" || next === prev) return null;
    // The board itself prints the gap and the points; the verdict only carries the juice.
    return { tone: pointsTone(next.points[next.currentRound] ?? 0), text: "" };
  },
  payload(s, ctx) {
    const total = totalScore(s);
    return {
      gameSlug: "stat-guesser",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: total,
      scoreMax: MAX_SCORE,
      scoreSortValue: total,
      scoreDisplay: `${total} of ${MAX_SCORE}`,
      resultJson: {
        v: 2,
        total,
        points: s.points.map((p) => p ?? 0),
        guesses: s.guesses.map((g) => g ?? 0),
        stats: s.rounds.map((r) => r.stat),
        targetIso3s: s.rounds.map((r) => r.country.iso3),
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${totalScore(s)} of ${MAX_SCORE}`,
  share: (s, ctx) =>
    buildStatGuesserShareText(
      { total: totalScore(s), max: MAX_SCORE, points: s.points.map((p) => p ?? 0), practice: ctx.mode === "practice" },
      ctx.dateKey,
    ),
  // While the pin is live the board owns the keys (arrows, Shift, Enter); in the reveal
  // Enter takes the next round.
  keys(s, dispatch): Record<string, () => void> {
    return s.phase === "reveal" ? { Enter: () => dispatch({ t: "next" }) } : {};
  },
  keyHint: "Arrows move the pin, Shift for fine steps, Enter locks",
  keepBoardOnResult: false,
  submits: true,
};
