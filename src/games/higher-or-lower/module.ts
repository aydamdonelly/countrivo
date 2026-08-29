import { mulberry32 } from "@/lib/seeded-random";
import { createHoL, guess, type HoLState as EngineState } from "@/lib/game-logic/higher-or-lower/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type Call = "higher" | "lower";

export interface HoLState {
  g: EngineState;
  /** The call during the 1500 ms reveal; the engine advances on `advance`. */
  pending: Call | null;
}

export type HoLAction = { t: "guess"; c: Call } | { t: "advance"; ui: true };

const ADVANCE: HoLAction = { t: "advance", ui: true };

function commit(s: HoLState): HoLState {
  return s.pending === null ? s : { g: guess(s.g, s.pending), pending: null };
}

export const module: GameModule<HoLState, HoLAction> = {
  slug: "higher-or-lower",
  create(seed) {
    return { g: createHoL(mulberry32(seed)), pending: null };
  },
  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "guess") {
      const base = commit(s);
      if (base.g.phase !== "playing") return base;
      return { g: base.g, pending: a.c };
    }
    return s;
  },
  codec,
  feedback: { ms: 1500, inWindow: (s) => s.pending !== null, advance: ADVANCE },
  done: (s) => s.pending === null && s.g.phase === "gameover",
  progress(s) {
    const g = commit(s).g;
    return { done: g.streak, label: "streak", value: String(g.streak), extra: `best ${Math.max(g.bestStreak, g.streak)}`, flame: true };
  },
  verdict(prev, next, a) {
    if (a.t !== "guess" || next.pending === null) return null;
    const round = next.g.rounds[next.g.currentRound];
    if (next.pending !== round.answer) return { tone: "bad", text: "Wrong. Streak ends." };
    return { tone: "good", text: "Right.", milestone: (next.g.streak + 1) % 5 === 0 };
  },
  payload(s, ctx) {
    const g = commit(s).g;
    return {
      gameSlug: "higher-or-lower",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.streak,
      scoreMax: g.streak,
      scoreSortValue: g.streak,
      scoreDisplay: `Streak: ${g.streak}`,
      resultJson: { streak: g.streak, bestStreak: g.bestStreak, totalRounds: g.rounds.length, lastAnswer: g.lastAnswer },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${commit(s).g.streak} in a row`,
  keys(s, dispatch) {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    return { ArrowUp: () => dispatch({ t: "guess", c: "higher" }), ArrowDown: () => dispatch({ t: "guess", c: "lower" }) };
  },
  keyHint: "arrow up higher · arrow down lower",
  keepBoardOnResult: false,
  submits: true,
};
