import { mulberry32 } from "@/lib/seeded-random";
import { createBorderline, makeMove, type BorderlineState as EngineState } from "@/lib/game-logic/borderline/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface BorderlineState {
  g: EngineState;
  /** The last rejection, shown under the field for 2 s (blueprint 8.8). */
  error: string | null;
  /** Bumped on every rejection so the same message restarts its 2 s window. */
  errSeq: number;
}

export type BorderlineAction = { t: "move"; name: string } | { t: "clearerr"; ui: true };

/** The error clears itself after this long. */
const ERROR_MS = 2000;

export const gameModule: GameModule<BorderlineState, BorderlineAction> = {
  slug: "borderline",
  create(seed) {
    return { g: createBorderline(mulberry32(seed)), error: null, errSeq: 0 };
  },
  reduce(s, a) {
    if (a.t === "clearerr") return s.error === null ? s : { ...s, error: null };
    if (a.t !== "move" || s.g.phase !== "playing") return s;
    const res = makeMove(s.g, a.name);
    if (res.error) return { g: s.g, error: res.error, errSeq: s.errSeq + 1 };
    return { g: res.state, error: null, errSeq: s.errSeq };
  },
  codec,
  persist: () => false,
  after(s) {
    return s.error === null ? null : { ms: ERROR_MS, then: { t: "clearerr", ui: true }, busy: false };
  },
  done: (s) => s.g.phase === "finished",
  progress(s) {
    return { done: s.g.moveCount, label: "steps", value: String(s.g.moveCount), extra: `optimal ${s.g.optimalLength}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "move") return null;
    if (next.errSeq !== prev.errSeq) return { tone: "bad", text: next.error ?? "Not a border." };
    if (next.g === prev.g) return null;
    if (next.g.won) return { tone: "good", text: `Target reached in ${next.g.moveCount} steps.` };
    return { tone: "neutral", text: `In ${next.g.currentCountry.displayName}.` };
  },
  payload(s, ctx) {
    return {
      gameSlug: "borderline",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.g.optimalLength,
      scoreMax: s.g.moveCount,
      scoreSortValue: s.g.moveCount,
      scoreDisplay: `${s.g.moveCount} steps`,
      resultJson: { score: s.g.moveCount, total: s.g.optimalLength, path: s.g.path.map((c) => c.iso3) },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.g.moveCount} steps`,
  keyHint: "Enter move · Tab fill",
  keepBoardOnResult: true,
  submits: false,
};
