import { mulberry32 } from "@/lib/seeded-random";
import { createStatGuesser, nextRound, submitGuess, type StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { buildStatGuesserShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type GuesserAction = { t: "guess"; v: number } | { t: "next" };

export function avgError(s: StatGuesserState): number {
  const scores = s.scores.filter((x): x is number => x !== null);
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / s.rounds.length) * 10) / 10;
}

export function errorTone(e: number): "good" | "neutral" | "bad" {
  return e < 20 ? "good" : e < 50 ? "neutral" : "bad";
}

export const gameModule: GameModule<StatGuesserState, GuesserAction> = {
  slug: "stat-guesser",
  create(seed) {
    return createStatGuesser(mulberry32(seed), 5);
  },
  reduce(s, a) {
    if (a.t === "guess") return Number.isFinite(a.v) ? submitGuess(s, a.v) : s;
    if (a.t === "next") return nextRound(s);
    return s;
  },
  codec,
  done: (s) => s.phase === "results",
  progress(s) {
    const total = s.rounds.length;
    const r = s.currentRound;
    return { done: r + (s.phase === "feedback" || s.phase === "results" ? 1 : 0), total, label: "round", value: `${Math.min(r + 1, total)} of ${total}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "guess" || next === prev) return null;
    const e = next.scores[next.currentRound] ?? 0;
    return { tone: errorTone(e), text: `${e} % off` };
  },
  payload(s, ctx) {
    const avg = avgError(s);
    const scores = s.scores.map((x) => x ?? 0);
    return {
      gameSlug: "stat-guesser",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: Math.round(Math.max(0, 100 - avg)),
      scoreMax: 100,
      scoreSortValue: Math.round(Math.max(0, 100 - avg)),
      scoreDisplay: `${avg}% avg error`,
      resultJson: {
        avgError: avg,
        totalError: Math.round(scores.reduce((a, b) => a + b, 0) * 10) / 10,
        scores,
        guesses: s.guesses.map((x) => x ?? 0),
        rounds: s.rounds.length,
        targetIso3s: s.rounds.map((r) => r.country.iso3),
        targetIso3: s.rounds[0].country.iso3,
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${avgError(s)} % avg error`,
  share: (s, ctx) => buildStatGuesserShareText({ avgError: avgError(s) }, ctx.dateKey),
  keys(s, dispatch): Record<string, () => void> {
    return s.phase === "feedback" ? { Enter: () => dispatch({ t: "next" }) } : {};
  },
  keyHint: "Enter next",
  keepBoardOnResult: false,
  submits: true,
};
