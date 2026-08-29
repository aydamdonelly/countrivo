import { mulberry32 } from "@/lib/seeded-random";
import { checkAnswer, createBlitz, type BlitzState } from "@/lib/game-logic/blitz/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

/**
 * `answer` carries the milliseconds the round took, measured by the board from the gesture
 * (blueprint 8.2 rule 2): the engine stamps its own `Date.now()`, which never reaches a
 * reducer here, so `create` and `reduce` stay pure.
 */
export type BlitzAction = { t: "answer"; text: string; ms: number } | { t: "advance"; ui: true };

export const BLITZ_ROUNDS = 10;
/** The name is shown for this long between rounds (blueprint 8.5). */
const BETWEEN_MS = 1500;

const ADVANCE: BlitzAction = { t: "advance", ui: true };

export const gameModule: GameModule<BlitzState, BlitzAction> = {
  slug: "blitz",
  create(seed) {
    // roundStartTime is the engine's only impure field; the module never reads it.
    return { ...createBlitz(mulberry32(seed)), roundStartTime: 0 };
  },
  reduce(s, a) {
    if (a.t === "advance") {
      if (s.phase !== "between") return s;
      const next = s.currentRound + 1;
      if (next >= s.totalRounds) return { ...s, phase: "results" };
      return { ...s, phase: "playing", currentRound: next };
    }
    if (a.t !== "answer" || s.phase !== "playing") return s;
    const round = s.rounds[s.currentRound];
    if (!round || round.answered) return s;
    const correct = checkAnswer(a.text, round.country);
    const rounds = [...s.rounds];
    rounds[s.currentRound] = { ...round, answered: true, correct, timeMs: Math.max(0, Math.round(a.ms)) };
    return { ...s, phase: "between", rounds, myScore: s.myScore + (correct ? 1 : 0) };
  },
  codec,
  persist: () => false,
  feedback: { ms: BETWEEN_MS, inWindow: (s) => s.phase === "between", advance: ADVANCE },
  done: (s) => s.phase === "results",
  progress(s) {
    const answered = s.rounds.filter((r) => r.answered).length;
    return {
      done: answered,
      total: BLITZ_ROUNDS,
      label: "round",
      value: `${Math.min(s.currentRound + 1, BLITZ_ROUNDS)} of ${BLITZ_ROUNDS}`,
      extra: `right ${s.myScore}`,
      misses: s.rounds.map((r, i) => (r.answered && !r.correct ? i : -1)).filter((i) => i >= 0),
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next === prev) return null;
    return next.rounds[next.currentRound].correct ? { tone: "good", text: "Right." } : { tone: "bad", text: "Missed." };
  },
  payload(s, ctx) {
    const correct = s.rounds.filter((r) => r.correct);
    const avgMs = correct.length ? correct.reduce((sum, r) => sum + (r.timeMs ?? 0), 0) / correct.length : 0;
    return {
      gameSlug: "blitz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.myScore,
      scoreMax: BLITZ_ROUNDS,
      scoreSortValue: s.myScore,
      scoreDisplay: `${s.myScore} / ${BLITZ_ROUNDS}`,
      resultJson: { score: s.myScore, total: BLITZ_ROUNDS, correct: s.myScore, avgMs: Math.round(avgMs) },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.myScore} / ${BLITZ_ROUNDS}`,
  keepBoardOnResult: false,
  submits: false,
};

/** `1.8 s`, the mean over the rounds that were right. */
export function averageSeconds(s: BlitzState): string | null {
  const correct = s.rounds.filter((r) => r.correct && r.timeMs !== null);
  if (correct.length === 0) return null;
  const avg = correct.reduce((sum, r) => sum + (r.timeMs ?? 0), 0) / correct.length / 1000;
  return `${avg.toFixed(1)} s`;
}
