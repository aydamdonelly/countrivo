import type { DraftGameState } from "./types";
import { generateDraftConfig } from "./generator";

export function createGame(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string
): DraftGameState {
  const config = generateDraftConfig(rng, mode, dateKey);

  return {
    config,
    currentStep: 0,
    assignments: new Array(config.countries.length).fill(null),
    usedCategories: new Set(),
    phase: "playing",
    undoUsed: false,
  };
}

/**
 * Index of the pick that an undo would take back. While playing that's the
 * previous step; once the final pick locked the run into "results" it's the
 * current (last) step, which is where currentStep stays on completion.
 */
function lastPickIndex(state: DraftGameState): number {
  return state.phase === "results" ? state.currentStep : state.currentStep - 1;
}

/** One undo per run, and only if there is a pick to take back. */
export function canUndo(state: DraftGameState): boolean {
  if (state.undoUsed) return false;
  const idx = lastPickIndex(state);
  return idx >= 0 && state.assignments[idx] != null;
}

/** Take back the last pick — frees its category and returns to that country. */
export function undoLastAssignment(state: DraftGameState): DraftGameState {
  if (!canUndo(state)) return state;

  const idx = lastPickIndex(state);
  const categoryIdx = state.assignments[idx]!;

  const newAssignments = [...state.assignments];
  newAssignments[idx] = null;

  const newUsed = new Set(state.usedCategories);
  newUsed.delete(categoryIdx);

  return {
    ...state,
    assignments: newAssignments,
    usedCategories: newUsed,
    currentStep: idx,
    phase: "playing",
    undoUsed: true,
  };
}

export function getCurrentCountry(state: DraftGameState) {
  if (state.phase !== "playing") return null;
  return state.config.countries[state.currentStep];
}

export function getAvailableCategories(state: DraftGameState) {
  return state.config.categories
    .map((cat, idx) => ({ category: cat, index: idx }))
    .filter(({ index }) => !state.usedCategories.has(index));
}

export function canAssign(state: DraftGameState, categoryIdx: number): boolean {
  return state.phase === "playing" && !state.usedCategories.has(categoryIdx);
}

export function assignCategory(
  state: DraftGameState,
  categoryIdx: number
): DraftGameState {
  if (!canAssign(state, categoryIdx)) return state;

  const newAssignments = [...state.assignments];
  newAssignments[state.currentStep] = categoryIdx;

  const newUsed = new Set(state.usedCategories);
  newUsed.add(categoryIdx);

  const nextStep = state.currentStep + 1;
  const isComplete = nextStep >= state.config.countries.length;

  return {
    ...state,
    assignments: newAssignments,
    usedCategories: newUsed,
    currentStep: isComplete ? state.currentStep : nextStep,
    phase: isComplete ? "results" : "playing",
  };
}

export function isComplete(state: DraftGameState): boolean {
  return state.phase === "results";
}
