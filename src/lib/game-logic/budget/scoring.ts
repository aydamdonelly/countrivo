import type { BudgetState, BudgetResult, BudgetGrade } from "./types";

function accToGrade(a: number): BudgetGrade {
  if (a >= 100) return "perfect";
  if (a >= 90) return "excellent";
  if (a >= 75) return "great";
  if (a >= 60) return "good";
  if (a >= 40) return "okay";
  return "poor";
}

function accToStars(a: number): number {
  if (a >= 100) return 5;
  if (a >= 90) return 4;
  if (a >= 75) return 3;
  if (a >= 60) return 2;
  return 1;
}

export function budgetResult(state: BudgetState): BudgetResult {
  const trueShares = state.config.countries.map((c) => c.trueShare);
  const perError = state.allocation.map((a, i) => Math.abs(a - trueShares[i]));
  const totalError = perError.reduce((a, b) => a + b, 0);
  const baseError = state.config.baseError;

  // Baseline-relative: even split (= baseError) scores 0, perfect scores 100.
  const accuracy =
    baseError > 0
      ? Math.round(100 * Math.max(0, 1 - totalError / baseError))
      : totalError === 0
        ? 100
        : 0;

  return {
    accuracy,
    totalError,
    baseError,
    perError,
    allocation: state.allocation,
    trueShares,
    grade: accToGrade(accuracy),
    stars: accToStars(accuracy),
  };
}
