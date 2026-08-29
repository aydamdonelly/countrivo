/*
 * Capital Match (blueprint 8.8, drill tier): ten countries, four capitals each, score out of
 * ten. The sibling of Flag Quiz and deliberately its twin in grammar, so the two drills read
 * as one product: the same 1200 ms reveal window, the same `Right.` / `Wrong. It was X.`
 * verdict, the same `7 / 10` score. Only the question differs, and here the flag is
 * information rather than the answer, so the country is named above the options.
 *
 * The engine in src/lib/game-logic/capital-match/engine.ts is pure and untouched. This
 * adapter adds the one thing it has no concept of, the reveal window (blueprint 8.5): a pick
 * is held in `pending` so the board can paint the fill states on the question just answered,
 * and the host's queued `advance` commits it through `answerCapital`. Replay applies that
 * advance right after every answer, so a resumed board is never stuck mid-window.
 *
 * `create` is pure: the same seed deals the same ten countries on the server and on the
 * client, so the first HTML is the real board and hydration finds identical markup.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { answerCapital, createCapitalMatch, type CapitalMatchState, type CapitalQuestion } from "@/lib/game-logic/capital-match/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface CapitalState {
  /** The engine state: the ten questions, the committed answers and the score. */
  g: CapitalMatchState;
  /** The option picked during the reveal window; null while the board waits for a pick. */
  pending: number | null;
}

export type CapitalAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

/** Ten countries (blueprint 10.5: "Ten countries, four capitals each."). */
export const CAPITAL_QUESTIONS = 10;
/** Four capitals per country; the engine always deals three distractors. */
export const CAPITAL_OPTIONS = 4;
/** The reveal window before the next country (blueprint 8.5). */
export const CAPITAL_FEEDBACK_MS = 1200;

const ADVANCE: CapitalAction = { t: "advance", ui: true };

/** Commits the held pick through the engine; a no-op when nothing is pending. */
function commit(s: CapitalState): CapitalState {
  return s.pending === null ? s : { g: answerCapital(s.g, s.pending), pending: null };
}

/** The question the board is showing (the answered one while a pick is pending). */
export function currentQuestion(s: CapitalState): CapitalQuestion {
  return s.g.questions[s.g.currentQuestion];
}

/** True while the held pick is the right one; drives the running `right N` count. */
export function pendingCorrect(s: CapitalState): boolean {
  return s.pending !== null && s.pending === currentQuestion(s).correctIndex;
}

/** Question indices answered wrongly, including a pending miss: the ember-outlined pips. */
function misses(s: CapitalState): number[] {
  const out: number[] = [];
  s.g.questions.forEach((q, i) => {
    const a = s.g.answers[i];
    if (a !== null && a !== q.correctIndex) out.push(i);
  });
  if (s.pending !== null && !pendingCorrect(s)) out.push(s.g.currentQuestion);
  return out;
}

/** Answers on the board, the pending one included: the filled pips and the `country N of 10` value. */
function answered(s: CapitalState): number {
  const committed = s.g.answers.filter((a) => a !== null).length;
  return Math.min(committed + (s.pending === null ? 0 : 1), CAPITAL_QUESTIONS);
}

/** Right answers on the board, the pending one included. */
export function rightSoFar(s: CapitalState): number {
  return s.g.score + (pendingCorrect(s) ? 1 : 0);
}

export const gameModule: GameModule<CapitalState, CapitalAction> = {
  slug: "capital-match",

  create(seed) {
    return { g: createCapitalMatch(mulberry32(seed), CAPITAL_QUESTIONS), pending: null };
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

  feedback: { ms: CAPITAL_FEEDBACK_MS, inWindow: (s) => s.pending !== null, advance: ADVANCE },

  done: (s) => s.pending === null && s.g.phase === "results",

  /** Session line: `country 3 of 10` · `right 2`, ten pips (the question index, blueprint 8.9). */
  progress(s) {
    const shown = Math.min(s.g.currentQuestion + 1, CAPITAL_QUESTIONS);
    return {
      done: answered(s),
      total: CAPITAL_QUESTIONS,
      label: "country",
      value: `${shown} of ${CAPITAL_QUESTIONS}`,
      extra: `right ${rightSoFar(s)}`,
      misses: misses(s),
    };
  },

  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null || next.pending === prev.pending) return null;
    const q = currentQuestion(next);
    if (next.pending === q.correctIndex) return { tone: "good", text: "Right." };
    return { tone: "bad", text: `Wrong. It was ${q.correctCapital}.` };
  },

  /** The frozen submission shape (understand.json engines.capital-match.submission). */
  payload(s, ctx) {
    const { g } = commit(s);
    const total = g.questions.length;
    return {
      gameSlug: "capital-match",
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

  keys(s, dispatch): Record<string, () => void> {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    const map: Record<string, () => void> = {};
    for (let i = 0; i < CAPITAL_OPTIONS; i += 1) map[String(i + 1)] = () => dispatch({ t: "answer", i });
    return map;
  },

  keyHint: "1 to 4 pick",
  keepBoardOnResult: false,
  submits: true,
};
