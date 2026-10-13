import { mulberry32 } from "@/lib/seeded-random";
import {
  answer,
  createSpeedFlags,
  DURATION_MS,
  LOCK_MS,
  MAX_ANSWERS,
  nextFlag,
  REVEAL_MS,
  startGame,
  tick,
  unlock,
  type SpeedFlagsState,
} from "@/lib/game-logic/speed-flags/engine";
import { buildSpeedFlagsShare } from "@/lib/share/speed-flags";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

/**
 * `start`, `answer` and `tick` carry the wall clock so the engine stays pure. `next` closes
 * the reveal and `unlock` lifts the new flag's input lock; the host times both. Nothing is
 * persisted: a live clock cannot be resumed (blueprint 8.3).
 */
export type SpeedAction =
  | { t: "start"; now: number }
  | { t: "answer"; i: number; now: number }
  | { t: "next" }
  | { t: "unlock"; ui: true }
  | { t: "tick"; now: number; ui: true };

/** The round length in seconds. */
export const SPEED_SECONDS = DURATION_MS / 1000;
/** The seconds burn ember from here down (concept 5.8). */
export const HOT_SECONDS = 5;
/** The penalty mark beside the seconds. U+2212 is a minus sign, not a dash. */
export const PENALTY_LABEL = "−3 s";
/**
 * How often the board asks the engine what time it is. The reducer folds every tick that
 * changes nothing visible back to the same state object, so ten reads a second cost exactly
 * as many renders as one does, and the round ends within 100 ms of its true end.
 */
export const TICK_MS = 100;

export const gameModule: GameModule<SpeedFlagsState, SpeedAction> = {
  slug: "speed-flags",
  create(seed) {
    return createSpeedFlags(mulberry32(seed));
  },
  reduce(s, a) {
    switch (a.t) {
      case "start":
        return startGame(s, a.now);
      case "answer":
        return answer(s, a.i, a.now);
      case "next":
        return nextFlag(s);
      case "unlock":
        return unlock(s);
      case "tick":
        return tick(s, a.now);
      default:
        return s;
    }
  },
  codec,
  persist: () => false,
  done: (s) => s.phase === "results",
  progress(s) {
    // The header timer: the seconds in Erode, ember from 5 s down, and the penalty mark for
    // 600 ms after a wrong answer. The bar stands full on the ready screen.
    const base = { total: SPEED_SECONDS, bar: true, timer: true, label: "time" };
    if (s.phase === "ready") return { ...base, done: SPEED_SECONDS, value: `${SPEED_SECONDS} s` };
    return {
      ...base,
      done: s.timeLeft,
      hot: s.timeLeft <= HOT_SECONDS,
      value: `${s.timeLeft} s`,
      extra: s.penaltyUntil !== null ? PENALTY_LABEL : undefined,
    };
  },
  verdict(prev, next, a) {
    // The row fill is the verdict; the line stays empty and the tone only drives the juice.
    if (a.t !== "answer" || next.total === prev.total) return null;
    return next.correct > prev.correct ? { tone: "good", text: "" } : { tone: "bad", text: "" };
  },
  feedback: {
    ms: REVEAL_MS,
    inWindow: (s) => s.phase === "playing" && s.reveal !== null,
    advance: { t: "next" },
  },
  after(s) {
    if (s.phase !== "playing" || !s.locked || s.reveal !== null) return null;
    return { ms: LOCK_MS, then: { t: "unlock", ui: true }, busy: true };
  },
  payload(s, ctx) {
    return {
      gameSlug: "speed-flags",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.correct,
      scoreMax: MAX_ANSWERS,
      scoreSortValue: s.correct,
      scoreDisplay: `${s.correct} right`,
      resultJson: { correct: s.correct, wrong: s.wrong, total: s.total, seconds: SPEED_SECONDS },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => String(s.correct),
  share: (s) => buildSpeedFlagsShare(s.correct),
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase === "ready") {
      const go = () => dispatch({ t: "start", now: Date.now() });
      return { Enter: go, " ": go };
    }
    if (s.phase !== "playing") return {};
    return {
      "1": () => dispatch({ t: "answer", i: 0, now: Date.now() }),
      "2": () => dispatch({ t: "answer", i: 1, now: Date.now() }),
    };
  },
  keepBoardOnResult: true,
  submits: true,
};
