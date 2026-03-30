import type { DraftGameConfig, DraftGameState } from "./types";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { generateDraftConfig } from "./generator";

export function createGame(mode: "daily" | "practice"): DraftGameState {
  const dateKey = mode === "daily" ? getTodayDateKey() : `practice-${Date.now()}`;
  const rng =
    mode === "daily" ? getDailyRng(dateKey) : mulberry32(Date.now());

  const config = generateDraftConfig(rng, mode, dateKey);

  return {
    config,
    currentStep: 0,
    assignments: new Array(config.countries.length).fill(null),
    usedCategories: new Set(),
    phase: "playing",
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
