import { mulberry32 } from "@/lib/seeded-random";
import { answer, createSpeedFlags, startGame, tick, type SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type SpeedAction = { t: "start"; now: number } | { t: "answer"; i: number } | { t: "tick"; now: number; ui: true };

/** The round length in seconds (the engine's DURATION_MS). */
export const SPEED_SECONDS = 20;
/** The timer burns under this many seconds (blueprint 6.3.9). */
export const HOT_SECONDS = 5;
/**
 * How often the board asks the engine what time it is. The clock is wall-clock (`endsAt`),
 * so a coarse interval would let the round run up to a second past its end; the reducer
 * folds every tick that changes neither the second nor the phase back to the same state
 * object, so five reads a second cost exactly as many renders as one does.
 */
export const TICK_MS = 200;

function exhausted(s: SpeedFlagsState): boolean {
  return s.phase === "playing" && s.currentIdx >= s.queue.length;
}

export function accuracy(s: SpeedFlagsState): number {
  return s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
}

/** The compact score, and the score_display the run is saved under. One flag is not "1 flags". */
export function flagsLabel(correct: number): string {
  return `${correct} ${correct === 1 ? "flag" : "flags"}`;
}

export const gameModule: GameModule<SpeedFlagsState, SpeedAction> = {
  slug: "speed-flags",
  create(seed) {
    return createSpeedFlags(mulberry32(seed));
  },
  reduce(s, a) {
    switch (a.t) {
      case "start":
        return s.phase === "ready" ? startGame(s, a.now) : s;
      case "answer":
        return answer(s, a.i);
      case "tick": {
        const next = tick(s, a.now);
        return next.phase === s.phase && next.timeLeft === s.timeLeft ? s : next;
      }
      default:
        return s;
    }
  },
  codec,
  persist: () => false,
  done: (s) => s.phase === "results" || exhausted(s),
  progress(s) {
    // The bar is the round: it stands full while the ready screen waits and drains from the
    // first second, so the twenty seconds are on screen before the player commits to them.
    const base = { total: SPEED_SECONDS, bar: true, timer: true, label: "time" };
    if (s.phase === "ready") return { ...base, done: SPEED_SECONDS, value: `${SPEED_SECONDS} s` };
    return { ...base, done: s.timeLeft, hot: s.timeLeft <= HOT_SECONDS, value: `${s.timeLeft} s`, extra: `right ${s.correct}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next === prev) return null;
    return next.correct > prev.correct ? { tone: "good", text: "Right." } : { tone: "bad", text: "Wrong." };
  },
  payload(s, ctx) {
    return {
      gameSlug: "speed-flags",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.correct,
      scoreMax: 100,
      scoreSortValue: s.correct,
      scoreDisplay: flagsLabel(s.correct),
      resultJson: { correct: s.correct, total: s.total, accuracy: accuracy(s) },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => flagsLabel(s.correct),
  keys(s, dispatch): Record<string, () => void> {
    // Enter starts the round from the keyboard; the Start button's own Enter activation is
    // pre-empted by the key handler, so the round can only ever start once.
    if (s.phase === "ready") return { Enter: () => dispatch({ t: "start", now: Date.now() }) };
    if (s.phase !== "playing") return {};
    return { "1": () => dispatch({ t: "answer", i: 0 }), "2": () => dispatch({ t: "answer", i: 1 }) };
  },
  keyHint: "1 or 2 pick",
  keepBoardOnResult: false,
  submits: true,
};
