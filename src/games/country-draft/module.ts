import { mulberry32 } from "@/lib/seeded-random";
import { assignCategory, canUndo, createGame, getCurrentCountry, isComplete, undoLastAssignment } from "@/lib/game-logic/country-draft/engine";
import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import type { DraftGameState } from "@/lib/game-logic/country-draft/types";
import { buildCountryDraftShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface DraftState {
  g: DraftGameState;
  /** The reveal window was acknowledged (or the 60 s ran out). */
  seen: boolean;
  /** The country index of the pick that just landed, for the animated rank; null on a resume. */
  lastPick: number | null;
}

export type DraftAction = { t: "pick"; c: number } | { t: "undo" } | { t: "seen" };

/** The reveal window after the 8th pick (blueprint 8.8): the board stays up, undo still works, then `seen`. */
export const RESULT_REVEAL_MS = 60_000;

export const DRAFT_MAX_SCORE = 8 * 243;

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

export const module: GameModule<DraftState, DraftAction> = {
  slug: "country-draft",
  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey), seen: false, lastPick: null };
  },
  reduce(s, a) {
    switch (a.t) {
      case "pick": {
        const step = s.g.currentStep;
        const g = assignCategory(s.g, a.c);
        return g === s.g ? s : { g, seen: false, lastPick: step };
      }
      case "undo":
        return canUndo(s.g) ? { g: undoLastAssignment(s.g), seen: false, lastPick: null } : s;
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
    return { done: n, total: 8, label: "score", value: String(runningScore(s.g)), extra: n >= 8 ? "all picks in" : `${8 - n} pick${8 - n === 1 ? "" : "s"} left` };
  },
  verdict(prev, next, a) {
    if (a.t !== "pick" || next === prev) return null;
    const rank = next.g.config.costMatrix[prev.g.currentStep][a.c];
    if (rank <= 5) return { tone: "good", text: `Rank ${rank}. Great pick.`, delta: `+${rank}` };
    if (rank <= 30) return { tone: "neutral", text: `Solid. Rank ${rank}.`, delta: `+${rank}` };
    return { tone: "bad", text: `Costly. Rank ${rank}.`, delta: `+${rank}` };
  },
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
    return buildCountryDraftShareText({ playerScore: r.playerScore, assignments: r.assignments, optimalAssignments: r.optimalAssignments, rank: ctx.rank }, ctx.dateKey);
  },
  keys(s, dispatch) {
    const map: Record<string, () => void> = {};
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
