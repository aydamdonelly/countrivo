/*
 * Country Draft, the anchor daily (blueprint 8.8). Eight countries arrive one at a time and
 * each one is put on the stat where it ranks best in the world; the score is the sum of the
 * eight ranks and lower is better. This adapter is pure and React-free: it wraps the kept
 * engine under src/lib/game-logic/country-draft, so the board, the resume replay and the
 * server validator all read the same deterministic config.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  assignCategory,
  canUndo,
  createGame,
  getCurrentCountry,
  isComplete,
  undoLastAssignment,
} from "@/lib/game-logic/country-draft/engine";
import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import type { DraftGameState, DraftResult } from "@/lib/game-logic/country-draft/types";
import { buildCountryDraftShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface DraftState {
  g: DraftGameState;
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
export const GRADE_WORD: Record<DraftResult["grade"], string> = {
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

export type DraftAction = { t: "pick"; c: number } | { t: "undo" } | { t: "seen" };

/** The reveal window after the 8th pick (blueprint 8.8): the board stays up, undo still works. */
export const RESULT_REVEAL_MS = 60_000;

/** 8 picks at the worst possible rank (blueprint: scoreMax, and the validator's ceiling). */
export const DRAFT_MAX_SCORE = 8 * 243;

/** The number of picks in a run; the engine deals one country per category. */
export const DRAFT_PICKS = 8;

/** The running total: the ranks of the picks made so far. */
export function runningScore(g: DraftGameState): number {
  let total = 0;
  g.assignments.forEach((c, i) => {
    if (c !== null) total += g.config.costMatrix[i][c];
  });
  return total;
}

export function assignedCount(g: DraftGameState): number {
  return g.assignments.filter((c) => c !== null).length;
}

/** The rank a pick would score, used for the verdict of the action that just landed. */
function rankOf(g: DraftGameState, countryIdx: number, categoryIdx: number): number {
  return g.config.costMatrix[countryIdx][categoryIdx];
}

export const gameModule: GameModule<DraftState, DraftAction> = {
  slug: "country-draft",

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

  progress(s) {
    const n = assignedCount(s.g);
    const left = DRAFT_PICKS - n;
    return {
      done: n,
      total: DRAFT_PICKS,
      label: "score",
      value: String(runningScore(s.g)),
      extra: left === 0 ? "all picks in" : `${left} pick${left === 1 ? "" : "s"} left`,
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
      gameSlug: "country-draft",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: r.playerScore,
      scoreMax: DRAFT_MAX_SCORE,
      // Lower is better; the server recomputes this the same way.
      scoreSortValue: DRAFT_MAX_SCORE - r.playerScore,
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
    return buildCountryDraftShareText(
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
