import { mulberry32 } from "@/lib/seeded-random";
import { answerRound, createOddOneOut, nextRound, type OddOneOutState } from "@/lib/game-logic/odd-one-out/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type OddAction = { t: "answer"; i: number } | { t: "next" };

export const ODD_ROUNDS = 5;

export const gameModule: GameModule<OddOneOutState, OddAction> = {
  slug: "odd-one-out",
  create(seed) {
    return createOddOneOut(mulberry32(seed), ODD_ROUNDS);
  },
  reduce(s, a) {
    if (a.t === "answer") return s.phase === "playing" && a.i >= 0 && a.i < 4 ? answerRound(s, a.i) : s;
    if (a.t === "next") return nextRound(s);
    return s;
  },
  codec,
  done: (s) => s.phase === "results",
  progress(s) {
    const total = s.rounds.length;
    const answered = s.currentRound + (s.phase === "playing" ? 0 : 1);
    return {
      done: Math.min(answered, total),
      total,
      label: "round",
      value: `${Math.min(s.currentRound + 1, total)} of ${total}`,
      extra: `right ${s.score}`,
      misses: s.answers.map((ans, i) => (ans !== null && ans !== s.rounds[i].oddIndex ? i : -1)).filter((i) => i >= 0),
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next === prev) return null;
    return next.score > prev.score ? { tone: "good", text: "Right." } : { tone: "bad", text: "Wrong." };
  },
  payload(s, ctx) {
    const total = s.rounds.length;
    return {
      gameSlug: "odd-one-out",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.score,
      scoreMax: total,
      scoreSortValue: s.score,
      scoreDisplay: `${s.score} / ${total}`,
      resultJson: { score: s.score, total, answers: s.answers },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.score} / ${s.rounds.length}`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase === "feedback") return { Enter: () => dispatch({ t: "next" }) };
    if (s.phase !== "playing") return {};
    return { "1": () => dispatch({ t: "answer", i: 0 }), "2": () => dispatch({ t: "answer", i: 1 }), "3": () => dispatch({ t: "answer", i: 2 }), "4": () => dispatch({ t: "answer", i: 3 }) };
  },
  keyHint: "1 to 4 pick · Enter next",
  keepBoardOnResult: false,
  submits: true,
};

/** `The other three are in Africa.` (the engine's description, given a full stop). */
export function traitLine(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}
