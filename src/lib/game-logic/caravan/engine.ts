import { generateCaravanConfig } from "./generator";
import type { CaravanState } from "./types";

export function createCaravan(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string,
): CaravanState {
  return {
    config: generateCaravanConfig(rng, mode, dateKey),
    bought: [],
    goldSpent: 0,
    phase: "playing",
  };
}

export function goldLeft(state: CaravanState): number {
  return state.config.budget - state.goldSpent;
}

/** Cheapest gold needed to fill `slots` more items from the unbought shelf,
 *  excluding `excludeIdx`. Used to forbid buys that would strand you below 5. */
function cheapestFill(state: CaravanState, slots: number, excludeIdx: number): number {
  if (slots <= 0) return 0;
  const prices = state.config.items
    .map((it, i) => ({ i, price: it.price }))
    .filter(({ i }) => i !== excludeIdx && !state.bought.includes(i))
    .map((x) => x.price)
    .sort((a, b) => a - b)
    .slice(0, slots);
  return prices.reduce((a, b) => a + b, 0);
}

/** A buy is allowed only if it's affordable AND you can still fill all 5 slots
 *  afterward with the cheapest remaining items (no soft-locks). */
export function canBuy(state: CaravanState, idx: number): boolean {
  if (state.phase !== "playing") return false;
  if (idx < 0 || idx >= state.config.items.length) return false;
  if (state.bought.includes(idx)) return false;
  if (state.bought.length >= state.config.buyCount) return false;
  const remaining = goldLeft(state) - state.config.items[idx].price;
  if (remaining < 0) return false;
  const slotsAfter = state.config.buyCount - (state.bought.length + 1);
  return cheapestFill(state, slotsAfter, idx) <= remaining;
}

export function buyItem(state: CaravanState, idx: number): CaravanState {
  if (!canBuy(state, idx)) return state;
  const bought = [...state.bought, idx];
  const goldSpent = state.goldSpent + state.config.items[idx].price;
  return {
    ...state,
    bought,
    goldSpent,
    phase: bought.length >= state.config.buyCount ? "results" : "playing",
  };
}
