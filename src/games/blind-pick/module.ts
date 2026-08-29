/*
 * Blind Pick (blueprint 8.8; formerly the game at /games/country-draft). Eight stat
 * categories sit on the board and eight countries arrive one at a time, with no way to
 * know what comes next; each one is put on the stat where it ranks best in the world. The
 * score is the sum of the eight ranks, lower is better, and it is measured against the
 * optimal assignment. This adapter is pure and React-free: it wraps the kept engine under
 * src/lib/game-logic/blind-pick, so the board, the resume replay and the server validator
 * all read the same deterministic config.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  assignCategory,
  canUndo,
  createGame,
  getCurrentCountry,
  isComplete,
  undoLastAssignment,
} from "@/lib/game-logic/blind-pick/engine";
import { computeResult } from "@/lib/game-logic/blind-pick/scoring";
import type { BlindPickGame, BlindPickResult } from "@/lib/game-logic/blind-pick/types";
import { buildBlindPickShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface BlindPickState {
  g: BlindPickGame;
  /** The reveal window was acknowledged (by the button, a key, or the 60 s timer). */
  seen: boolean;
  /** The country index of the pick that just landed, for the counting rank; null after an undo. */
  lastPick: number | null;
  /**
   * Board-changing actions applied so far. Deterministic under replay, so the board can
   * snapshot it at mount and animate only what moves after that: a resumed board arrives
   * settled, with no rank counting up and no subject sliding in on first paint.
   */
  moves: number;
}

/** The grade the engine gives the gap, as one word (blueprint 8.7: the grade is a word, never stars). */
export const GRADE_WORD: Record<BlindPickResult["grade"], string> = {
  perfect: "Perfect.",
  excellent: "Excellent.",
  great: "Great.",
  good: "Good.",
  okay: "Okay.",
  poor: "Poor.",
};

/**
 * The width of a rank cell on the result and run rows. The two columns are pinned so the
 * eight rows read as columns instead of a ragged list: the stat icon opens every cell and
 * the rank closes it, on every row.
 */
export const RANK_CELL = { width: 62, display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 6 } as const;

export type BlindPickAction = { t: "pick"; c: number } | { t: "undo" } | { t: "seen" };

/** The reveal window after the 8th pick (blueprint 8.8): the board stays up, undo still works. */
export const RESULT_REVEAL_MS = 60_000;

/** 8 picks at the worst possible rank (blueprint: scoreMax, and the validator's ceiling). */
export const BLIND_PICK_MAX_SCORE = 8 * 243;

/** The number of picks in a run; the engine deals one country per category. */
export const PICK_COUNT = 8;

/** The running total: the ranks of the picks made so far. */
export function runningScore(g: BlindPickGame): number {
  let total = 0;
  g.assignments.forEach((c, i) => {
    if (c !== null) total += g.config.costMatrix[i][c];
  });
  return total;
}

export function assignedCount(g: BlindPickGame): number {
  return g.assignments.filter((c) => c !== null).length;
}

/** The rank a pick would score, used for the verdict of the action that just landed. */
function rankOf(g: BlindPickGame, countryIdx: number, categoryIdx: number): number {
  return g.config.costMatrix[countryIdx][categoryIdx];
}

export const gameModule: GameModule<BlindPickState, BlindPickAction> = {
  slug: "blind-pick",

  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey), seen: false, lastPick: null, moves: 0 };
  },

  reduce(s, a) {
    switch (a.t) {
      case "pick": {
        const countryIdx = s.g.currentStep;
        const g = assignCategory(s.g, a.c);
        if (g === s.g) return s;
        return { g, seen: false, lastPick: countryIdx, moves: s.moves + 1 };
      }
      case "undo": {
        if (!canUndo(s.g)) return s;
        return { g: undoLastAssignment(s.g), seen: false, lastPick: null, moves: s.moves + 1 };
      }
      case "seen":
        return isComplete(s.g) && !s.seen ? { ...s, seen: true } : s;
      default:
        return s;
    }
  },

  codec,

  done: (s) => isComplete(s.g) && s.seen,

  /*
   * The session line carries the game's whole idea: the score so far, and how many countries
   * are still waiting behind the one on the board. `unseen` is what the player is actually
   * gambling against on every pick, so it is the one fact worth a permanent place up there.
   */
  progress(s) {
    const n = assignedCount(s.g);
    const unseen = PICK_COUNT - n - 1;
    return {
      done: n,
      total: PICK_COUNT,
      label: "score",
      value: String(runningScore(s.g)),
      extra: isComplete(s.g) ? "all picks in" : unseen === 0 ? "last country" : `unseen ${unseen}`,
    };
  },

  verdict(prev, next, a) {
    if (next === prev) return null;
    if (a.t === "undo") return { tone: "neutral", text: "Pick taken back." };
    if (a.t !== "pick") return null;
    const rank = rankOf(next.g, prev.g.currentStep, a.c);
    const delta = `+${rank}`;
    if (rank <= 5) return { tone: "good", text: `Rank ${rank}. Great pick.`, delta };
    if (rank <= 30) return { tone: "neutral", text: `Solid. Rank ${rank}.`, delta };
    return { tone: "bad", text: `Costly. Rank ${rank}.`, delta };
  },

  /**
   * The 60 s reveal window (blueprint 8.8): the board stays live so the last pick can still
   * be taken back, and the run settles by itself if nobody presses "See result".
   */
  after(s) {
    return isComplete(s.g) && !s.seen ? { ms: RESULT_REVEAL_MS, then: { t: "seen" }, busy: false } : null;
  },

  payload(s, ctx) {
    const r = computeResult(s.g);
    return {
      gameSlug: "blind-pick",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: r.playerScore,
      scoreMax: BLIND_PICK_MAX_SCORE,
      // Lower is better; the server recomputes this the same way.
      scoreSortValue: BLIND_PICK_MAX_SCORE - r.playerScore,
      scoreDisplay: `Score: ${r.playerScore} (Gap: ${r.gap})`,
      resultJson: {
        playerScore: r.playerScore,
        optimalScore: r.optimalScore,
        gap: r.gap,
        grade: r.grade,
        stars: r.stars,
        assignments: r.assignments,
        optimalAssignments: r.optimalAssignments,
        countryIso3s: s.g.config.countries.map((c) => c.iso3),
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => String(runningScore(s.g)),

  share(s, ctx) {
    const r = computeResult(s.g);
    return buildBlindPickShareText(
      { playerScore: r.playerScore, assignments: r.assignments, optimalAssignments: r.optimalAssignments, rank: ctx.rank },
      ctx.dateKey,
    );
  },

  /** Digits 1 to 8 pick the slot at that position; Enter closes the reveal window. */
  keys(s, dispatch): Record<string, () => void> {
    const map: Record<string, () => void> = {};
    if (isComplete(s.g)) {
      if (!s.seen) map.Enter = () => dispatch({ t: "seen" });
      return map;
    }
    if (!getCurrentCountry(s.g)) return map;
    s.g.config.categories.forEach((_, i) => {
      if (!s.g.usedCategories.has(i)) map[String(i + 1)] = () => dispatch({ t: "pick", c: i });
    });
    return map;
  },

  keyHint: "1 to 8 pick",
  keepBoardOnResult: true,
  submits: true,
};
