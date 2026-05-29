import { generateBudgetConfig } from "./generator";
import type { BudgetState } from "./types";

export function createBudget(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
): BudgetState {
  return {
    config: generateBudgetConfig(rng, mode, dateKey),
    allocation: [0, 0, 0, 0, 0],
    phase: "playing",
  };
}

export function tokensUsed(state: BudgetState): number {
  return state.allocation.reduce((a, b) => a + b, 0);
}

export function tokensLeft(state: BudgetState): number {
  return state.config.tokens - tokensUsed(state);
}

/** Change one card's tokens by delta, clamped to [0, …] and to the remaining pool. */
export function adjust(state: BudgetState, idx: number, delta: number): BudgetState {
  if (state.phase !== "playing") return state;
  if (idx < 0 || idx >= state.allocation.length) return state;
  const current = state.allocation[idx];
  let next = current + delta;
  if (next < 0) next = 0;
  const othersSum = tokensUsed(state) - current;
  const max = state.config.tokens - othersSum;
  if (next > max) next = max;
  if (next === current) return state;
  const allocation = [...state.allocation];
  allocation[idx] = next;
  return { ...state, allocation };
}

export function submitBudget(state: BudgetState): BudgetState {
  if (state.phase !== "playing") return state;
  if (tokensUsed(state) !== state.config.tokens) return state;
  return { ...state, phase: "results" };
}
