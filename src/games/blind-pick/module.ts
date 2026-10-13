/*
 * Blind Pick (concept 5.7, pane BP1). Six countries arrive one at a time and six stats wait;
 * each country goes on the stat where it ranks highest among sovereign states, without
 * seeing who comes next. The tap is the commit (no undo). Scoring is golf: the sum of the six
 * ranks minus the perfect board's sum, "Perfect" or "+N", par +10.
 *
 * This adapter is pure and React-free: it wraps the engine under src/lib/game-logic/blind-pick,
 * so the board, the resume replay and the server validator all read the same deterministic
 * board.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { createGame, getCurrentCountry, isComplete, place } from "@/lib/game-logic/blind-pick/engine";
import {
  BLIND_PICK_MAX_OVER,
  BLIND_PICK_PAR,
  computeResult,
  overLabel,
  placementMark,
  tierFor,
} from "@/lib/game-logic/blind-pick/scoring";
import type { BlindPickGame } from "@/lib/game-logic/blind-pick/types";
import { buildBlindPickShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface BlindPickState {
  g: BlindPickGame;
  /** The last placement's flip was shown; the run is done once this is set on a full board. */
  seen: boolean;
  /**
   * Board-changing actions applied so far. Deterministic under replay, so the board can
   * snapshot it at mount and animate only what moves after that: a resumed board arrives
   * settled, with no slot flipping and no country sliding in on first paint.
   */
  moves: number;
}

export type BlindPickAction = { t: "place"; s: number } | { t: "seen" };

/** Six countries, six stats. */
export const PICK_COUNT = 6;

/** How long the last flip stays on the board before the result takes over. */
export const LAST_FLIP_MS = 900;

/** The board after a pick: the placed count, for the session line. */
function placedCount(g: BlindPickGame): number {
  return g.placements.length;
}

export const gameModule: GameModule<BlindPickState, BlindPickAction> = {
  slug: "blind-pick",

  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey), seen: false, moves: 0 };
  },

  reduce(s, a) {
    switch (a.t) {
      case "place": {
        const g = place(s.g, a.s);
        if (g === s.g) return s;
        return { g, seen: false, moves: s.moves + 1 };
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
    const n = placedCount(s.g);
    return { done: n, total: PICK_COUNT, label: "placed", value: `${n} of ${PICK_COUNT}` };
  },

  /*
   * The reveal lives in the slot itself ("#12 of 193", the tier word), so the verdict line
   * stays empty and only carries the juice: a Top 10 landing plays the good beat, anything
   * else the neutral one. A low rank is not an error, so nothing here is ever "bad".
   */
  verdict(prev, next, a) {
    if (next === prev || a.t !== "place") return null;
    const c = prev.g.placements.length;
    const rank = next.g.config.costMatrix[c][a.s];
    const tier = tierFor(rank, next.g.config.of[a.s]);
    return { tone: tier === "Top 10" ? "good" : "neutral", text: "" };
  },

  /** The last flip stays up for LAST_FLIP_MS, then the result takes the screen. */
  feedback: {
    ms: LAST_FLIP_MS,
    inWindow: (s) => isComplete(s.g) && !s.seen,
    advance: { t: "seen" },
  },

  payload(s, ctx) {
    const r = computeResult(s.g);
    const cfg = s.g.config;
    return {
      gameSlug: "blind-pick",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: r.over,
      scoreMax: BLIND_PICK_MAX_OVER,
      // Golf: lower is better, so the board sorts on minus the score (the server recomputes it).
      scoreSortValue: -r.over,
      scoreDisplay: overLabel(r.over),
      resultJson: {
        v: 2,
        over: r.over,
        par: BLIND_PICK_PAR,
        playerScore: r.playerScore,
        optimalScore: r.optimalScore,
        countryIso3s: cfg.countries.map((c) => c.iso3),
        stats: cfg.categories.map((c) => c.slug),
        of: [...cfg.of],
        placements: r.placements,
        ranks: r.ranks,
        perfect: r.perfect,
        perfectRanks: r.perfectRanks,
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel(s) {
    if (!isComplete(s.g)) return `${placedCount(s.g)} of ${PICK_COUNT}`;
    return overLabel(computeResult(s.g).over);
  },

  share(s, ctx) {
    const r = computeResult(s.g);
    const marks = r.placements.map((slot, c) => placementMark(slot, r.ranks[c], r.perfect[c], r.perfectRanks[c]));
    return buildBlindPickShareText({ over: r.over, marks, practice: ctx.mode === "practice" }, ctx.dateKey);
  },

  /** Digits 1 to 6 place the waiting country on the slot at that position. */
  keys(s, dispatch): Record<string, () => void> {
    const map: Record<string, () => void> = {};
    if (!getCurrentCountry(s.g)) return map;
    s.g.config.categories.forEach((_, i) => {
      if (!s.g.placements.includes(i)) map[String(i + 1)] = () => dispatch({ t: "place", s: i });
    });
    return map;
  },

  keepBoardOnResult: false,
  submits: true,
};
