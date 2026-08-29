import { mulberry32 } from "@/lib/seeded-random";
import { createCluster, isOneAway, matchedGroup, submitGuess, toggleTile, CLUSTER_GROUP_SIZE, type ClusterState } from "@/lib/game-logic/cluster/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type ClusterAction = { t: "toggle"; iso3: string } | { t: "clear"; ui: true } | { t: "submit" };

export const module: GameModule<ClusterState, ClusterAction> = {
  slug: "cluster",
  create(seed) {
    return createCluster(mulberry32(seed));
  },
  reduce(s, a) {
    switch (a.t) {
      case "toggle":
        return toggleTile(s, a.iso3);
      case "clear":
        return s.selected.length ? { ...s, selected: [] } : s;
      case "submit":
        return submitGuess(s);
      default:
        return s;
    }
  },
  codec,
  done: (s) => s.phase !== "playing",
  progress(s) {
    const solved = s.solvedGroupIds.length;
    const misses = Array.from({ length: Math.min(s.mistakes, 4 - solved) }, (_, i) => solved + i);
    return { done: solved, total: 4, label: "groups", value: `${solved} of 4`, extra: `mistakes ${s.mistakes} of 4`, misses, current: solved + misses.length < 4 && s.phase === "playing" ? solved + misses.length : null };
  },
  verdict(prev, next, a) {
    if (a.t !== "submit" || next === prev) return null;
    if (next.solvedGroupIds.length > prev.solvedGroupIds.length) {
      const id = next.solvedGroupIds[next.solvedGroupIds.length - 1];
      const g = next.groups.find((x) => x.id === id);
      return { tone: "good", text: `${g?.trait ?? "A group"}.` };
    }
    if (isOneAway(prev)) return { tone: "bad", text: "One away." };
    if (next.mistakes === 3) return { tone: "bad", text: "One mistake left." };
    return { tone: "bad", text: "Not a group." };
  },
  payload(s, ctx) {
    const solved = s.solvedGroupIds.length;
    return {
      gameSlug: "cluster",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: solved,
      scoreMax: 4,
      scoreSortValue: solved,
      scoreDisplay: `${solved}/4`,
      resultJson: { solved, mistakes: s.mistakes, groups: s.groups.map((g) => g.members), guesses: s.guesses },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.solvedGroupIds.length}/4`,
  keys(s, dispatch) {
    const map: Record<string, () => void> = {};
    if (s.selected.length === CLUSTER_GROUP_SIZE && matchedGroup(s) !== undefined) map.Enter = () => dispatch({ t: "submit" });
    if (s.selected.length) {
      map.Backspace = () => dispatch({ t: "clear", ui: true });
      map.Escape = () => dispatch({ t: "clear", ui: true });
    }
    return map;
  },
  keyHint: "Enter submit · Backspace deselect",
  keepBoardOnResult: true,
  submits: true,
};
