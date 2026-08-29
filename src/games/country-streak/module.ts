import { mulberry32 } from "@/lib/seeded-random";
import { answerStreak, createStreak, type StreakState as EngineState } from "@/lib/game-logic/country-streak/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface StreakState {
  g: EngineState;
  pending: number | null;
}

export type StreakAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

const ADVANCE: StreakAction = { t: "advance", ui: true };

function commit(s: StreakState): StreakState {
  return s.pending === null ? s : { g: answerStreak(s.g, s.pending), pending: null };
}

export const module: GameModule<StreakState, StreakAction> = {
  slug: "country-streak",
  create(seed) {
    return { g: createStreak(mulberry32(seed)), pending: null };
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
  feedback: { ms: 800, inWindow: (s) => s.pending !== null, advance: ADVANCE },
  done: (s) => s.pending === null && s.g.phase === "gameover",
  progress(s) {
    const g = commit(s).g;
    return { done: g.streak, label: "streak", value: String(g.streak), extra: `best ${Math.max(g.bestStreak, g.streak)}`, flame: true };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null) return null;
    const correct = next.pending === next.g.correctIndex;
    if (!correct) return { tone: "bad", text: `Wrong. It was ${next.g.options[next.g.correctIndex].displayName}.` };
    return { tone: "good", text: "Right.", milestone: (next.g.streak + 1) % 5 === 0 };
  },
  payload(s, ctx) {
    const g = commit(s).g;
    return {
      gameSlug: "country-streak",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.streak,
      scoreMax: 243,
      scoreSortValue: g.streak,
      scoreDisplay: `Streak: ${g.streak}`,
      resultJson: { streak: g.streak, bestStreak: g.bestStreak },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${commit(s).g.streak} in a row`,
  keys(s, dispatch) {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    return { "1": () => dispatch({ t: "answer", i: 0 }), "2": () => dispatch({ t: "answer", i: 1 }), "3": () => dispatch({ t: "answer", i: 2 }), "4": () => dispatch({ t: "answer", i: 3 }) };
  },
  keyHint: "1 to 4 pick",
  keepBoardOnResult: false,
  submits: true,
};
