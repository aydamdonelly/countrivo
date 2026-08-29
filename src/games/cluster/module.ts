/*
 * Cluster (blueprint 8.8): sixteen countries, four hidden groups of four, four mistakes.
 * The adapter is React-free and runs on the server and the client, so the board in the
 * first HTML is the board the player keeps. Everything it knows comes from the pure engine
 * in src/lib/game-logic/cluster; nothing here reads the clock or a random source.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  CLUSTER_GROUP_COUNT,
  CLUSTER_GROUP_SIZE,
  CLUSTER_MAX_MISTAKES,
  createCluster,
  isOneAway,
  submitGuess,
  toggleTile,
  type ClusterGroup,
  type ClusterState,
} from "@/lib/game-logic/cluster/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

/**
 * `clear` is a real action, not a `ui` one: the resume log is folded into a single
 * selection token (8.3), so a deselect that is not recorded would leave the encoder
 * holding a selection the reducer has already dropped. Folded away it costs no bytes,
 * and `verdict` returns null for it, so it is never juiced.
 */
export type ClusterAction = { t: "toggle"; iso3: string } | { t: "clear" } | { t: "submit" };

/** Every iso3 that already sits in a solved group; the grid drops them, the bands carry them. */
export function solvedMembers(state: ClusterState): Set<string> {
  const out = new Set<string>();
  for (const id of state.solvedGroupIds) {
    const group = state.groups.find((g) => g.id === id);
    if (group) for (const iso3 of group.members) out.add(iso3);
  }
  return out;
}

/** The groups in the order the player cracked them, then the ones left, in canonical order. */
export function groupsInPlayOrder(state: ClusterState): ClusterGroup[] {
  const solved = state.solvedGroupIds.map((id) => state.groups.find((g) => g.id === id)).filter((g): g is ClusterGroup => g != null);
  const rest = state.groups.filter((g) => !state.solvedGroupIds.includes(g.id));
  return [...solved, ...rest];
}

/** One word for the shot, `.t-h3` on the result rows (blueprint 8.7). */
export function grade(state: ClusterState): string {
  const solved = state.solvedGroupIds.length;
  if (solved === CLUSTER_GROUP_COUNT) return state.mistakes === 0 ? "Flawless." : "Cracked it.";
  if (solved === 3) return "One short.";
  if (solved === 2) return "Halfway.";
  if (solved === 1) return "One group.";
  return "No groups.";
}

export const gameModule: GameModule<ClusterState, ClusterAction> = {
  slug: "cluster",
  create(seed) {
    return createCluster(mulberry32(seed));
  },
  reduce(state, action) {
    switch (action.t) {
      case "toggle":
        return toggleTile(state, action.iso3);
      case "clear":
        return state.selected.length > 0 ? { ...state, selected: [] } : state;
      case "submit":
        return submitGuess(state);
      default:
        return state;
    }
  },
  codec,
  done: (state) => state.phase !== "playing",
  progress(state) {
    const solved = state.solvedGroupIds.length;
    const open = CLUSTER_GROUP_COUNT - solved;
    // Four pips, one per group: the ones you cracked in ink, the ones your mistakes cost
    // you in an ember outline, and the slot still in play in ember (blueprint 3.19, 8.8).
    const burnt = Math.min(state.mistakes, open);
    const misses = Array.from({ length: burnt }, (_, i) => solved + i);
    const current = state.phase === "playing" && solved + burnt < CLUSTER_GROUP_COUNT ? solved + burnt : null;
    return {
      done: solved,
      total: CLUSTER_GROUP_COUNT,
      label: "groups",
      value: `${solved} of ${CLUSTER_GROUP_COUNT}`,
      extra: `mistakes ${state.mistakes} of ${CLUSTER_MAX_MISTAKES}`,
      misses,
      current,
    };
  },
  verdict(prev, next, action) {
    if (action.t !== "submit" || next === prev) return null;
    if (next.solvedGroupIds.length > prev.solvedGroupIds.length) {
      const id = next.solvedGroupIds[next.solvedGroupIds.length - 1];
      const group = next.groups.find((g) => g.id === id);
      return { tone: "good", text: group ? `${group.trait}.` : "A group." };
    }
    if (isOneAway(prev)) return { tone: "bad", text: "One away." };
    if (next.mistakes === CLUSTER_MAX_MISTAKES - 1) return { tone: "bad", text: "One mistake left." };
    return { tone: "bad", text: "Not a group." };
  },
  payload(state, ctx) {
    const solved = state.solvedGroupIds.length;
    return {
      gameSlug: "cluster",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: solved,
      scoreMax: CLUSTER_GROUP_COUNT,
      scoreSortValue: solved,
      scoreDisplay: `${solved}/${CLUSTER_GROUP_COUNT}`,
      resultJson: {
        solved,
        mistakes: state.mistakes,
        groups: state.groups.map((g) => g.members),
        guesses: state.guesses,
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (state) => `${state.solvedGroupIds.length}/${CLUSTER_GROUP_COUNT}`,
  keys(state, dispatch): Record<string, () => void> {
    if (state.phase !== "playing") return {};
    const map: Record<string, () => void> = {};
    if (state.selected.length === CLUSTER_GROUP_SIZE) map.Enter = () => dispatch({ t: "submit" });
    if (state.selected.length > 0) {
      const clear = () => dispatch({ t: "clear" });
      map.Backspace = clear;
      map.Escape = clear;
    }
    return map;
  },
  keyHint: "Enter submit · Backspace deselect",
  keepBoardOnResult: true,
  submits: true,
};
