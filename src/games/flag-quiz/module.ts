/*
 * Flag Quiz (blueprint 8.8, drill tier): ten flags, four names each, score out of ten.
 *
 * The engine in src/lib/game-logic/flag-quiz/engine.ts is pure and untouched; this adapter
 * adds one thing it has no concept of, the 1200 ms reveal window (blueprint 8.5). A pick is
 * held in `pending` so the board can show the fill states on the answered question, and the
 * host's queued `advance` commits it through `answerQuestion`. Replay applies that advance
 * right after every answer, so a resumed board is never mid-window.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { answerQuestion, createFlagQuiz, type FlagQuizState } from "@/lib/game-logic/flag-quiz/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface QuizState {
  /** The engine state: the ten questions, the committed answers and the score. */
  g: FlagQuizState;
  /** The option picked during the reveal window; null while the board waits for a pick. */
  pending: number | null;
}

export type QuizAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

/** Ten flags (blueprint 10.5: "Ten flags, four names each. Score out of ten."). */
export const QUIZ_QUESTIONS = 10;
/** Four names per flag; the engine always deals three distractors. */
export const QUIZ_OPTIONS = 4;
/** The reveal window before the next flag (blueprint 8.5). */
export const QUIZ_FEEDBACK_MS = 1200;

const ADVANCE: QuizAction = { t: "advance", ui: true };

/** Commits the held pick through the engine; a no-op when nothing is pending. */
function commit(s: QuizState): QuizState {
  return s.pending === null ? s : { g: answerQuestion(s.g, s.pending), pending: null };
}

/** The question the board is showing (the answered one while a pick is pending). */
export function currentQuestion(s: QuizState) {
  return s.g.questions[s.g.currentQuestion];
}

/** True while the held pick is the right one; drives the running `right N` count. */
export function pendingCorrect(s: QuizState): boolean {
  return s.pending !== null && s.pending === currentQuestion(s).correctIndex;
}

/** Question indices answered wrongly, including a pending miss: the ember-outlined pips. */
function misses(s: QuizState): number[] {
  const out: number[] = [];
  s.g.questions.forEach((q, i) => {
    const a = s.g.answers[i];
    if (a !== null && a !== q.correctIndex) out.push(i);
  });
  if (s.pending !== null && !pendingCorrect(s)) out.push(s.g.currentQuestion);
  return out;
}

/** Answers on the board, the pending one included: the filled pips and the `flag N of 10` value. */
function answered(s: QuizState): number {
  const committed = s.g.answers.filter((a) => a !== null).length;
  return Math.min(committed + (s.pending === null ? 0 : 1), QUIZ_QUESTIONS);
}

export const gameModule: GameModule<QuizState, QuizAction> = {
  slug: "flag-quiz",

  create(seed) {
    return { g: createFlagQuiz(mulberry32(seed), QUIZ_QUESTIONS), pending: null };
  },

  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "answer") {
      if (s.pending !== null || s.g.phase !== "playing") return s;
      if (!Number.isInteger(a.i) || a.i < 0 || a.i >= currentQuestion(s).options.length) return s;
      return { ...s, pending: a.i };
    }
    return s;
  },

  codec,

  feedback: { ms: QUIZ_FEEDBACK_MS, inWindow: (s) => s.pending !== null, advance: ADVANCE },

  done: (s) => s.pending === null && s.g.phase === "results",

  progress(s) {
    const shown = Math.min(s.g.currentQuestion + 1, QUIZ_QUESTIONS);
    return {
      done: answered(s),
      total: QUIZ_QUESTIONS,
      label: "flag",
      value: `${shown} of ${QUIZ_QUESTIONS}`,
      extra: `right ${s.g.score + (pendingCorrect(s) ? 1 : 0)}`,
      misses: misses(s),
    };
  },

  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null || next.pending === prev.pending) return null;
    const q = currentQuestion(next);
    if (next.pending === q.correctIndex) return { tone: "good", text: "Right." };
    return { tone: "bad", text: `Wrong. It was ${q.country.displayName}.` };
  },

  payload(s, ctx) {
    const { g } = commit(s);
    return {
      gameSlug: "flag-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.score,
      scoreMax: g.questions.length,
      scoreSortValue: g.score,
      scoreDisplay: `${g.score} / ${g.questions.length}`,
      resultJson: { score: g.score, total: g.questions.length, answers: g.answers },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => `${commit(s).g.score} / ${s.g.questions.length}`,

  keys(s, dispatch): Record<string, () => void> {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    const map: Record<string, () => void> = {};
    for (let i = 0; i < QUIZ_OPTIONS; i += 1) map[String(i + 1)] = () => dispatch({ t: "answer", i });
    return map;
  },

  keyHint: "1 to 4 pick",
  keepBoardOnResult: false,
  submits: true,
};
