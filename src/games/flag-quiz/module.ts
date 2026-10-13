/*
 * Flag Quiz (concept 5.4): ten flags of sovereign states, four names each, easy to hard.
 * Flags 1 to 7 score 1, flags 8 to 10 (lookalikes) score 2: points of 13, par 9.
 *
 * The engine in src/lib/game-logic/flag-quiz is pure. This adapter adds the 1.2 s reveal
 * window: a pick is held in `pending` so the board can show the reveal on the answered flag,
 * and the host's queued `advance` (or a tap on the board, which skips the wait) commits it
 * through `answerQuestion`. Replay applies the advance right after every answer, so a
 * resumed board is never mid-reveal.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  DOUBLE_FROM,
  FLAG_COUNT,
  MAX_POINTS,
  OPTION_COUNT,
  answerQuestion,
  createFlagQuiz,
  hits,
  type FlagQuizState,
} from "@/lib/game-logic/flag-quiz/engine";
import { buildFlagQuizShareText } from "@/lib/share/flag-quiz";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface QuizState {
  /** The engine state: the ten questions, the committed answers and the points. */
  g: FlagQuizState;
  /** The option picked during the reveal window; null while the board waits for a pick. */
  pending: number | null;
}

export type QuizAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

export const QUIZ_QUESTIONS = FLAG_COUNT;
export const QUIZ_OPTIONS = OPTION_COUNT;
export const QUIZ_MAX = MAX_POINTS;
/** The reveal holds 1.2 s, then advances (concept 5.4). */
export const QUIZ_FEEDBACK_MS = 1200;

export const ADVANCE: QuizAction = { t: "advance", ui: true };

/** Commits the held pick through the engine; a no-op when nothing is pending. */
function commit(s: QuizState): QuizState {
  return s.pending === null ? s : { g: answerQuestion(s.g, s.pending), pending: null };
}

/** The question the board is showing (the answered one while a pick is pending). */
export function currentQuestion(s: QuizState) {
  return s.g.questions[s.g.currentQuestion];
}

/** True from flag 8 on: the meta "Counts double" sits above the flag. */
export function countsDouble(s: QuizState): boolean {
  return s.g.currentQuestion >= DOUBLE_FROM;
}

/** True while the held pick is the right one. */
export function pendingCorrect(s: QuizState): boolean {
  return s.pending !== null && s.pending === currentQuestion(s).correctIndex;
}

/** Points on the board, the pending pick included. */
function points(s: QuizState): number {
  return s.g.score + (pendingCorrect(s) ? currentQuestion(s).points : 0);
}

/** Flag indices answered wrongly, a pending miss included: the ember-outlined pips. */
function misses(s: QuizState): number[] {
  const out: number[] = [];
  s.g.questions.forEach((q, i) => {
    const a = s.g.answers[i];
    if (a !== null && a !== q.correctIndex) out.push(i);
  });
  if (s.pending !== null && !pendingCorrect(s)) out.push(s.g.currentQuestion);
  return out;
}

/** Answers on the board, the pending one included: the filled pips. */
function answered(s: QuizState): number {
  const committed = s.g.answers.filter((a) => a !== null).length;
  return Math.min(committed + (s.pending === null ? 0 : 1), QUIZ_QUESTIONS);
}

export const gameModule: GameModule<QuizState, QuizAction> = {
  slug: "flag-quiz",

  create(seed, mode, dateKey) {
    return { g: createFlagQuiz(mulberry32(seed), { mode, dateKey }), pending: null };
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
    return {
      done: answered(s),
      total: QUIZ_QUESTIONS,
      label: "score",
      value: String(points(s)),
      extra: `of ${QUIZ_MAX}`,
      misses: misses(s),
    };
  },

  // The reveal is painted on the options themselves (and read out by the board's status
  // line), so the shared verdict line stays empty; the tone still drives the juice.
  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null || next.pending === prev.pending) return null;
    return { tone: pendingCorrect(next) ? "good" : "bad", text: "" };
  },

  payload(s, ctx) {
    const { g } = commit(s);
    return {
      gameSlug: "flag-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.score,
      scoreMax: QUIZ_MAX,
      scoreSortValue: g.score,
      scoreDisplay: `${g.score} of ${QUIZ_MAX}`,
      resultJson: { v: 2, score: g.score, total: QUIZ_MAX, answers: g.answers, hits: hits(g) },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => `${commit(s).g.score} of ${QUIZ_MAX}`,

  share(s, ctx) {
    const { g } = commit(s);
    return buildFlagQuizShareText({ points: g.score, max: QUIZ_MAX, hits: hits(g), dateKey: ctx.dateKey, practice: ctx.mode === "practice" });
  },

  // Keys 1 to 4 are bound by the board itself: it holds the 300 ms input guard on every new
  // flag and takes Enter or Space to skip the reveal, which the host's map cannot do while busy.
  keys: () => ({}),

  keyHint: "Press 1 to 4",
  keepBoardOnResult: false,
  submits: true,
};
