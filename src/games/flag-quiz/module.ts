import { mulberry32 } from "@/lib/seeded-random";
import { answerQuestion, createFlagQuiz, type FlagQuizState } from "@/lib/game-logic/flag-quiz/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface QuizState {
  g: FlagQuizState;
  /** The picked option during the 1200 ms window; the engine advances on `advance`. */
  pending: number | null;
}

export type QuizAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

const ADVANCE: QuizAction = { t: "advance", ui: true };

function commit(s: QuizState): QuizState {
  return s.pending === null ? s : { g: answerQuestion(s.g, s.pending), pending: null };
}

export function pendingCorrect(s: QuizState): boolean {
  return s.pending !== null && s.pending === s.g.questions[s.g.currentQuestion].correctIndex;
}

export const module: GameModule<QuizState, QuizAction> = {
  slug: "flag-quiz",
  create(seed) {
    return { g: createFlagQuiz(mulberry32(seed), 10), pending: null };
  },
  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "answer") {
      const base = commit(s);
      if (base.g.phase !== "playing" || a.i < 0 || a.i > 3) return base;
      return { g: base.g, pending: a.i };
    }
    return s;
  },
  codec,
  feedback: { ms: 1200, inWindow: (s) => s.pending !== null, advance: ADVANCE },
  done: (s) => s.pending === null && s.g.phase === "results",
  progress(s) {
    const q = s.g.currentQuestion;
    const total = s.g.questions.length;
    const answered = q + (s.pending !== null || s.g.phase === "results" ? 1 : 0);
    return { done: Math.min(answered, total), total, label: "flag", value: `${Math.min(q + 1, total)} of ${total}`, extra: `right ${s.g.score + (pendingCorrect(s) ? 1 : 0)}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null) return null;
    const q = next.g.questions[next.g.currentQuestion];
    return next.pending === q.correctIndex ? { tone: "good", text: "Right." } : { tone: "bad", text: `Wrong. It was ${q.country.displayName}.` };
  },
  payload(s, ctx) {
    const g = commit(s).g;
    const total = g.questions.length;
    return {
      gameSlug: "flag-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.score,
      scoreMax: total,
      scoreSortValue: g.score,
      scoreDisplay: `${g.score} / ${total}`,
      resultJson: { score: g.score, total, answers: g.answers },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${commit(s).g.score} / ${s.g.questions.length}`,
  keys(s, dispatch) {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    return { "1": () => dispatch({ t: "answer", i: 0 }), "2": () => dispatch({ t: "answer", i: 1 }), "3": () => dispatch({ t: "answer", i: 2 }), "4": () => dispatch({ t: "answer", i: 3 }) };
  },
  keyHint: "1 to 4 pick",
  keepBoardOnResult: false,
  submits: true,
};
