/*
 * Population Sort (blueprint 8.8): six countries, one statistic, put them in order, highest
 * first. The engine (src/lib/game-logic/population-sort/engine.ts) draws the six and scores
 * the submitted order value by value, so a day where two countries tie is still winnable;
 * this module is the adapter around it. Six rows everywhere, never five (blueprint 8.9).
 */
import statsData from "@/data/stats.json";
import { mulberry32 } from "@/lib/seeded-random";
import { createSortGame, submitSort, type SortGameState } from "@/lib/game-logic/population-sort/engine";
import type { GameModule } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { codec } from "./codec";

const stats: Record<string, Record<string, number | null>> = statsData;

/** Six rows. The registry's old "Sort 5 countries." is corrected in copy, not here. */
export const SORT_COUNT = 6;

export interface SortState {
  g: SortGameState;
  /** The keyboard cursor row. Null until an arrow key moves it, so no row wears a ring on arrival. */
  cursor: number | null;
}

export type SortAction =
  /** The whole order after a move. `at` is where the moved row landed; it is a verdict hint, never persisted. */
  | { t: "order"; perm: number[]; at?: number }
  | { t: "submit" }
  | { t: "cursor"; i: number; ui: true };

/** The order with the row at `from` lifted out and dropped at `to`. */
export function moved(order: readonly number[], from: number, to: number): number[] {
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** The country's value for the board's statistic, or null when the data has none. */
export function statOf(g: SortGameState, countryIndex: number): number | null {
  const country = g.countries[countryIndex];
  return country ? stats[country.iso3]?.[g.category.slug] ?? null : null;
}

/**
 * Did the player's row at `pos` belong there? The engine scores by value, so two countries
 * tied on the statistic both count wherever they sit; the board and the result rows read the
 * same rule, and neither can disagree with the score.
 */
export function placedRight(g: SortGameState, pos: number): boolean {
  const mine = statOf(g, g.userOrder[pos]);
  const theirs = statOf(g, g.correctOrder[pos]);
  return mine !== null && mine === theirs;
}

function isPermutation(perm: readonly number[], n: number): boolean {
  return perm.length === n && new Set(perm).size === n && perm.every((x) => Number.isInteger(x) && x >= 0 && x < n);
}

/** The row that went up: the first position whose country changed. Falls back for a replayed order. */
function movedRow(prev: readonly number[], next: readonly number[], at: number | undefined): number {
  if (at !== undefined && at >= 0 && at < next.length) return at;
  for (let i = 0; i < next.length; i += 1) if (next[i] !== prev[i]) return i;
  return 0;
}

export const gameModule: GameModule<SortState, SortAction> = {
  slug: "population-sort",
  create(seed) {
    return { g: createSortGame(mulberry32(seed), SORT_COUNT), cursor: null };
  },
  reduce(s, a) {
    if (a.t === "order") {
      if (s.g.phase !== "playing" || !isPermutation(a.perm, s.g.countries.length)) return s;
      if (a.perm.every((x, i) => x === s.g.userOrder[i])) return s;
      return { ...s, g: { ...s.g, userOrder: [...a.perm] } };
    }
    if (a.t === "submit") return s.g.phase === "playing" ? { ...s, g: submitSort(s.g) } : s;
    if (a.t === "cursor") return a.i >= 0 && a.i < s.g.countries.length && a.i !== s.cursor ? { ...s, cursor: a.i } : s;
    return s;
  },
  codec,
  done: (s) => s.g.phase === "results",
  progress(s) {
    const n = s.g.countries.length;
    if (s.g.phase === "results") return { done: 0, label: "in place", value: `${s.g.score} of ${n}` };
    return {
      done: 0,
      label: `sort ${n} by`,
      value: statLabel(s.g.category.slug, s.g.category.label),
      extra: "highest first",
    };
  },
  verdict(prev, next, a) {
    if (next === prev) return null;
    const n = next.g.countries.length;
    if (a.t === "order") {
      // Every move speaks, so the row that moved is announced (and the move is felt) even
      // when the player is working the arrows with their eyes on the flags.
      const pos = movedRow(prev.g.userOrder, next.g.userOrder, a.at);
      const country = next.g.countries[next.g.userOrder[pos]];
      return { tone: "neutral", text: `${country.displayName} is ${pos + 1} of ${n}.` };
    }
    if (a.t !== "submit") return null;
    const score = next.g.score;
    if (score === n) return { tone: "good", text: `All ${n} in order.` };
    if (score === 0) return { tone: "bad", text: "None in place." };
    return { tone: "neutral", text: `${score} of ${n} in place.` };
  },
  payload(s, ctx) {
    const g = s.g;
    return {
      gameSlug: "population-sort",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.score,
      scoreMax: g.countries.length,
      scoreSortValue: g.score,
      scoreDisplay: `${g.score} / ${g.countries.length}`,
      resultJson: {
        score: g.score,
        total: g.countries.length,
        category: g.category.slug,
        userOrder: g.userOrder,
        correctOrder: g.correctOrder,
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.g.score} / ${s.g.countries.length}`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.g.phase !== "playing") return {};
    const n = s.g.countries.length;
    const cursor = s.cursor;
    const step = (d: number) => () => dispatch({ t: "cursor", i: cursor === null ? 0 : Math.min(n - 1, Math.max(0, cursor + d)), ui: true });
    return {
      ArrowUp: step(-1),
      ArrowDown: step(1),
      " ": () => {
        if (cursor === null || cursor === 0) return;
        dispatch({ t: "order", perm: moved(s.g.userOrder, cursor, cursor - 1), at: cursor - 1 });
        dispatch({ t: "cursor", i: cursor - 1, ui: true });
      },
      Enter: () => dispatch({ t: "submit" }),
    };
  },
  keyHint: "arrows pick a row · Space moves it up · Enter submits",
  keepBoardOnResult: true,
  submits: true,
};
