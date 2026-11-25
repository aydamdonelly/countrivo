/*
 * Blind Pick. Eight countries arrive one at a time and eight stats wait;
 * each country goes on the stat where it ranks highest among sovereign states, without
 * seeing who comes next, with one undo. Scoring is golf: the sum of the
 * ranks minus the perfect board's sum, "Perfect" or "+N", par +10.
 *
 * This adapter is pure and React-free: it wraps the engine under src/lib/game-logic/blind-pick,
 * so the board, the resume replay and the server validator all read the same deterministic
 * board.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { createGame, getCurrentCountry, isComplete, place, undo, canUndo } from "@/lib/game-logic/blind-pick/engine";
import { BOARD_SIZE, LEGACY_BOARD_SIZE } from "@/lib/game-logic/blind-pick/generator";
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

export type BlindPickAction = { t: "place"; s: number } | { t: "seen" } | { t: "undo" };

export const PICK_COUNT = 8;
/** The rules version, written as `resultJson.v`: eight countries, one undo. */
export const BLIND_PICK_RULES_VERSION = 3;
/**
 * The content version a signed session carries. 3 is the frozen nine-statistic pool, 4 adds
 * the daily rotation (four anchors plus four rotating statistics) from BLIND_PICK_ROTATION_FROM.
 */
export const BLIND_PICK_VERSION = 4;
export const BLIND_PICK_V3_VERSION = 3;

/** How long the last flip stays on the board before the result takes over. */
export const LAST_FLIP_MS = 900;

/** The board after a pick: the placed count, for the session line. */
function placedCount(g: BlindPickGame): number {
  return g.placements.length;
}

export const gameModule: GameModule<BlindPickState, BlindPickAction> = {
  slug: "blind-pick",
  contentVersion: BLIND_PICK_VERSION,

  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey, BOARD_SIZE, "rotation"), seen: false, moves: 0 };
  },

  reduce(s, a) {
    switch (a.t) {
      case "place": {
        const g = place(s.g, a.s);
        if (g === s.g) return s;
        return { g, seen: false, moves: s.moves + 1 };
      }
      case "undo": {
        if (s.seen) return s;
        const g = undo(s.g);
        return g === s.g ? s : { g, seen: false, moves: s.moves + 1 };
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
    const total = s.g.config.countries.length;
    return { done: n, total, label: "placed", value: `${n} of ${total}` };
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
    inWindow: (s) => s.g.config.countries.length === LEGACY_BOARD_SIZE && isComplete(s.g) && !s.seen,
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
      scoreMax: Math.min(BLIND_PICK_MAX_OVER, cfg.countries.length * 195),
      // Golf: lower is better, so the board sorts on minus the score (the server recomputes it).
      scoreSortValue: -r.over,
      scoreDisplay: overLabel(r.over),
      resultJson: {
        v: cfg.countries.length === LEGACY_BOARD_SIZE ? 2 : BLIND_PICK_RULES_VERSION,
        undoUsed: s.g.undoUsed === true,
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
    if (!isComplete(s.g)) return `${placedCount(s.g)} of ${s.g.config.countries.length}`;
    return overLabel(computeResult(s.g).over);
  },

  share(s, ctx) {
    const r = computeResult(s.g);
    const marks = r.placements.map((slot, c) => placementMark(slot, r.ranks[c], r.perfect[c], r.perfectRanks[c]));
    return buildBlindPickShareText({ over: r.over, marks, practice: ctx.mode === "practice" }, ctx.dateKey);
  },

  /** Digits place the waiting country; U spends the one undo. */
  keys(s, dispatch): Record<string, () => void> {
    const map: Record<string, () => void> = {};
    if (!s.seen && canUndo(s.g)) map.u = () => dispatch({ t: "undo" });
    if (!getCurrentCountry(s.g)) return map;
    s.g.config.categories.forEach((_, i) => {
      if (!s.g.placements.includes(i)) map[String(i + 1)] = () => dispatch({ t: "place", s: i });
    });
    return map;
  },

  keepBoardOnResult: false,
  submits: true,
};

/** Sessions signed before the rotation keep the nine-statistic board for their seed. */
export const v3GameModule: GameModule<BlindPickState, BlindPickAction> = {
  ...gameModule,
  contentVersion: BLIND_PICK_V3_VERSION,
  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey, BOARD_SIZE, "v3"), seen: false, moves: 0 };
  },
};

/** Existing signed practice sessions keep the original board for their seed. */
export const legacyGameModule: GameModule<BlindPickState, BlindPickAction> = {
  ...gameModule,
  contentVersion: undefined,
  create(seed, mode, dateKey) {
    return { g: createGame(mulberry32(seed), mode, dateKey, LEGACY_BOARD_SIZE), seen: false, moves: 0 };
  },
};

/** The module that deals a signed session's board: 4 the rotation, 3 the nine-statistic pool, anything else the six-country game. */
export function blindPickModuleFor(contentVersion: number | undefined): GameModule<BlindPickState, BlindPickAction> {
  if (contentVersion === BLIND_PICK_VERSION) return gameModule;
  return contentVersion === BLIND_PICK_V3_VERSION ? v3GameModule : legacyGameModule;
}
