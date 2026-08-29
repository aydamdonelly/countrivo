import { mulberry32 } from "@/lib/seeded-random";
import { answer, createSpeedFlags, startGame, tick, type SpeedFlagsState } from "@/lib/game-logic/speed-flags/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type SpeedAction = { t: "start"; now: number } | { t: "answer"; i: number } | { t: "tick"; now: number; ui: true };

/** The round length in seconds (the engine's DURATION_MS). */
export const SPEED_SECONDS = 20;
/** The timer burns under this many seconds (blueprint 6.3.9). */
export const HOT_SECONDS = 5;

function exhausted(s: SpeedFlagsState): boolean {
  return s.phase === "playing" && s.currentIdx >= s.queue.length;
}

export function accuracy(s: SpeedFlagsState): number {
  return s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
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
      case "tick":
        return tick(s, a.now);
      default:
        return s;
    }
  },
  codec,
  persist: () => false,
  done: (s) => s.phase === "results" || exhausted(s),
  progress(s) {
    if (s.phase === "ready") return { done: 0, label: "ready", value: `${SPEED_SECONDS} s` };
    return {
      done: s.timeLeft,
      total: SPEED_SECONDS,
      bar: true,
      timer: true,
      hot: s.timeLeft <= HOT_SECONDS,
      label: "time",
      value: `${s.timeLeft} s`,
      extra: `right ${s.correct}`,
    };
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
      scoreDisplay: `${s.correct} flags`,
      resultJson: { correct: s.correct, total: s.total, accuracy: accuracy(s) },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.correct} flags`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase !== "playing") return {};
    return { "1": () => dispatch({ t: "answer", i: 0 }), "2": () => dispatch({ t: "answer", i: 1 }) };
  },
  keyHint: "1 or 2 pick",
  keepBoardOnResult: false,
  submits: true,
};
