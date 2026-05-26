import { seededShuffle } from "@/lib/seeded-random";
import type { ClusterAttempt, ClusterGroup, ClusterPuzzle, ClusterState } from "./types";

const MAX_ATTEMPTS = 4;
const GROUP_SIZE = 4;

function norm(iso3: string): string {
  return iso3.toUpperCase();
}

function sortedKey(iso3s: string[]): string {
  return [...iso3s].map(norm).sort().join("|");
}

function allCells(puzzle: ClusterPuzzle): string[] {
  return puzzle.groups.flatMap((g) => g.countryIso3s.map(norm));
}

function unsolvedGroups(state: ClusterState): ClusterGroup[] {
  const solvedKeys = new Set(state.solvedGroups.map((g) => sortedKey(g.countryIso3s)));
  return state.puzzle.groups.filter((g) => !solvedKeys.has(sortedKey(g.countryIso3s)));
}

function isInSolvedGroup(state: ClusterState, iso3: string): boolean {
  const target = norm(iso3);
  return state.solvedGroups.some((g) => g.countryIso3s.some((c) => norm(c) === target));
}

export function createCluster(rng: () => number, puzzle: ClusterPuzzle): ClusterState {
  const cells = allCells(puzzle);
  return {
    phase: "playing",
    puzzle,
    shuffledCells: seededShuffle(cells, rng),
    selected: [],
    solvedGroups: [],
    attemptsLeft: MAX_ATTEMPTS,
    attempts: [],
    won: false,
  };
}

export function toggleSelect(state: ClusterState, iso3: string): ClusterState {
  if (state.phase !== "playing") return state;
  const target = norm(iso3);
  if (isInSolvedGroup(state, target)) return state;

  const isSelected = state.selected.some((c) => norm(c) === target);
  if (isSelected) {
    return { ...state, selected: state.selected.filter((c) => norm(c) !== target) };
  }

  if (state.selected.length >= GROUP_SIZE) return state;
  return { ...state, selected: [...state.selected, target] };
}

export function clearSelection(state: ClusterState): ClusterState {
  if (state.selected.length === 0) return state;
  return { ...state, selected: [] };
}

export function shuffleRemaining(rng: () => number, state: ClusterState): ClusterState {
  // Re-shuffle the 16-cell display order. Solved-group cells stay anchored at the
  // start of the cells array (they're rendered in their group rows), while unsolved
  // cells are shuffled among themselves. The selected set is preserved as-is.
  const solvedIso3s = new Set(
    state.solvedGroups.flatMap((g) => g.countryIso3s.map(norm))
  );
  const solvedCells = state.shuffledCells.filter((c) => solvedIso3s.has(norm(c)));
  const unsolvedCells = state.shuffledCells.filter((c) => !solvedIso3s.has(norm(c)));
  const reshuffled = seededShuffle(unsolvedCells, rng);
  return { ...state, shuffledCells: [...solvedCells, ...reshuffled] };
}

export function submitGroup(state: ClusterState): ClusterState {
  if (state.phase !== "playing") return state;
  if (state.selected.length !== GROUP_SIZE) return state;

  const selectedKey = sortedKey(state.selected);
  const remainingGroups = unsolvedGroups(state);
  const matched = remainingGroups.find((g) => sortedKey(g.countryIso3s) === selectedKey);

  if (matched) {
    const attempt: ClusterAttempt = {
      iso3s: [...state.selected],
      correct: true,
      nearMiss: false,
      matchedTheme: matched.theme,
    };
    const solvedGroups = [...state.solvedGroups, matched];
    const won = solvedGroups.length === state.puzzle.groups.length;
    return {
      ...state,
      attempts: [...state.attempts, attempt],
      solvedGroups,
      selected: [],
      won,
      phase: won ? "finished" : "playing",
    };
  }

  // No match — compute best overlap against any unsolved real group to detect near-miss.
  const selectedSet = new Set(state.selected.map(norm));
  let bestOverlap = 0;
  for (const g of remainingGroups) {
    let overlap = 0;
    for (const iso of g.countryIso3s) {
      if (selectedSet.has(norm(iso))) overlap++;
    }
    if (overlap > bestOverlap) bestOverlap = overlap;
  }

  const attempt: ClusterAttempt = {
    iso3s: [...state.selected],
    correct: false,
    nearMiss: bestOverlap === GROUP_SIZE - 1,
  };
  const attemptsLeft = state.attemptsLeft - 1;
  const phase: ClusterState["phase"] = attemptsLeft <= 0 ? "finished" : "playing";

  return {
    ...state,
    attempts: [...state.attempts, attempt],
    selected: [],
    attemptsLeft,
    phase,
    won: false,
  };
}
