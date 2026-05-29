import type { CaravanState, CaravanResult, CaravanGrade } from "./types";

function effToGrade(eff: number): CaravanGrade {
  if (eff >= 100) return "perfect";
  if (eff >= 95) return "excellent";
  if (eff >= 85) return "great";
  if (eff >= 70) return "good";
  if (eff >= 50) return "okay";
  return "poor";
}

function effToStars(eff: number): number {
  if (eff >= 100) return 5;
  if (eff >= 95) return 4;
  if (eff >= 85) return 3;
  if (eff >= 70) return 2;
  return 1;
}

export function caravanResult(state: CaravanState): CaravanResult {
  const { config, bought, goldSpent } = state;
  const playerValue = bought.reduce((sum, i) => sum + config.items[i].value, 0);
  const efficiency =
    config.optimalValue > 0
      ? Math.round((playerValue / config.optimalValue) * 100)
      : 0;
  return {
    playerValue,
    optimalValue: config.optimalValue,
    efficiency,
    grade: effToGrade(efficiency),
    stars: effToStars(efficiency),
    bought,
    optimalBasket: config.optimalBasket,
    goldSpent,
    budget: config.budget,
  };
}
