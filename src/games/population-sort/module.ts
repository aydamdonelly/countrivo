import { mulberry32 } from "@/lib/seeded-random";
import { createSortGame, submitSort, type SortGameState } from "@/lib/game-logic/population-sort/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface SortState {
  g: SortGameState;
  /** The keyboard cursor row. */
  cursor: number;
}

export type SortAction = { t: "order"; perm: number[] } | { t: "submit" } | { t: "cursor"; i: number; ui: true };

function isPermutation(perm: number[], n: number): boolean {
  return perm.length === n && new Set(perm).size === n && perm.every((x) => Number.isInteger(x) && x >= 0 && x < n);
}

export function moved(order: number[], from: number, to: number): number[] {
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const module: GameModule<SortState, SortAction> = {
  slug: "population-sort",
  create(seed) {
    return { g: createSortGame(mulberry32(seed), 6), cursor: 0 };
  },
  reduce(s, a) {
    if (a.t === "order") {
      if (s.g.phase !== "playing" || !isPermutation(a.perm, s.g.countries.length)) return s;
      return { ...s, g: { ...s.g, userOrder: a.perm } };
    }
    if (a.t === "submit") return s.g.phase === "playing" ? { ...s, g: submitSort(s.g) } : s;
    if (a.t === "cursor") return a.i >= 0 && a.i < s.g.countries.length ? { ...s, cursor: a.i } : s;
    return s;
  },
  codec,
  done: (s) => s.g.phase === "results",
  progress(s) {
    return { done: 0, label: `sort ${s.g.countries.length} by`, value: s.g.category.shortLabel, extra: "highest first" };
  },
  verdict(prev, next, a) {
    if (a.t !== "submit" || next === prev) return null;
    const n = next.g.countries.length;
    return next.g.score === n ? { tone: "good", text: `All ${n === 6 ? "six" : n} in order.` } : { tone: "neutral", text: `${next.g.score} of ${n} in place.` };
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
      resultJson: { score: g.score, total: g.countries.length, category: g.category.slug, userOrder: g.userOrder, correctOrder: g.correctOrder },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.g.score} / ${s.g.countries.length}`,
  keys(s, dispatch) {
    if (s.g.phase !== "playing") return {};
    const n = s.g.countries.length;
    return {
      ArrowUp: () => dispatch({ t: "cursor", i: Math.max(0, s.cursor - 1), ui: true }),
      ArrowDown: () => dispatch({ t: "cursor", i: Math.min(n - 1, s.cursor + 1), ui: true }),
      " ": () => {
        if (s.cursor > 0) {
          dispatch({ t: "order", perm: moved(s.g.userOrder, s.cursor, s.cursor - 1) });
          dispatch({ t: "cursor", i: s.cursor - 1, ui: true });
        }
      },
      Enter: () => dispatch({ t: "submit" }),
    };
  },
  keyHint: "arrows select · Space move up · Enter submit",
  keepBoardOnResult: true,
  submits: true,
};
