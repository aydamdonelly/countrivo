import type { BlindPickGame } from "./types";

export const PICK_COUNT = 6;
export const STAT_WORDING: Readonly<Record<string, string>> = {
  population: "Most people", "area-km2": "Largest area", gdp: "Largest economy",
  "gdp-per-capita": "Most GDP per person", "urban-population-pct": "Most urban",
  "forest-coverage-pct": "Most forest", "internet-users-pct": "Most internet use",
  "life-expectancy": "Most years lived", "fertility-rate": "Most births per woman",
};
export function statWording(slug: string): string { return STAT_WORDING[slug] ?? slug; }
export function isComplete(state: BlindPickGame): boolean { return state.placements.length >= state.config.countries.length; }
export function currentIndex(state: BlindPickGame): number { return Math.min(state.placements.length, state.config.countries.length - 1); }
export function slotOwner(state: BlindPickGame, slot: number): number { return state.placements.indexOf(slot); }
