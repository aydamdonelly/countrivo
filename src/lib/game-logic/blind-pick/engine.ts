/**
 * Blind Pick (concept 5.7): six countries arrive one at a time and each is placed on one of
 * six stat slots. The tap is the commit: there is no undo. Pure, no React, no clock, no
 * Math.random; the RNG is injected.
 */
import type { Country } from "@/types/country";
import type { BlindPickGame } from "./types";
import { generateBlindPickConfig } from "./generator";

export function createGame(rng: () => number, mode: "daily" | "practice", dateKey: string): BlindPickGame {
  return { config: generateBlindPickConfig(rng, mode, dateKey), placements: [] };
}

export function isComplete(state: BlindPickGame): boolean {
  return state.placements.length >= state.config.countries.length;
}

/** The index of the country waiting to be placed, or the last one once the board is full. */
export function currentIndex(state: BlindPickGame): number {
  return Math.min(state.placements.length, state.config.countries.length - 1);
}

/** The country waiting to be placed, or null once all six are placed. */
export function getCurrentCountry(state: BlindPickGame): Country | null {
  return isComplete(state) ? null : state.config.countries[state.placements.length];
}

/** The country placed on a slot, or -1 while the slot is open. */
export function slotOwner(state: BlindPickGame, slot: number): number {
  return state.placements.indexOf(slot);
}

export function canPlace(state: BlindPickGame, slot: number): boolean {
  return (
    !isComplete(state) &&
    Number.isInteger(slot) &&
    slot >= 0 &&
    slot < state.config.categories.length &&
    !state.placements.includes(slot)
  );
}

/** Places the waiting country on a slot. Returns the same object when the move is not allowed. */
export function place(state: BlindPickGame, slot: number): BlindPickGame {
  if (!canPlace(state, slot)) return state;
  return { ...state, placements: [...state.placements, slot] };
}

/** The running sum of ranks of the countries placed so far. */
export function placedSum(state: BlindPickGame): number {
  return state.placements.reduce((sum, slot, c) => sum + state.config.costMatrix[c][slot], 0);
}
