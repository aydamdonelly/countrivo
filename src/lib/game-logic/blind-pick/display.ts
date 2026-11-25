import type { BlindPickGame } from "./types";

export const PICK_COUNT = 8;
export const STAT_WORDING: Readonly<Record<string, string>> = {
  population: "Population", "area-km2": "Total area", gdp: "Total GDP",
  "gdp-per-capita": "GDP per person", "urban-population-pct": "Urban population",
  "forest-coverage-pct": "Forest cover", "internet-users-pct": "Internet use",
  "life-expectancy": "Life expectancy", "fertility-rate": "Fertility rate",
  "population-density": "Population density", latitude: "Furthest north", "arable-land-pct": "Farmland",
};
export const STAT_DEFINITIONS: Readonly<Record<string, string>> = {
  population: "Total people", "area-km2": "Area in km²", gdp: "Economic output in USD",
  "gdp-per-capita": "Output per person in USD", "urban-population-pct": "% of people living in cities",
  "forest-coverage-pct": "% of land covered by forest", "internet-users-pct": "% of people using the internet",
  "life-expectancy": "Expected years at birth", "fertility-rate": "Children per woman",
  "population-density": "People per km²", latitude: "Latitude of the country's centre",
  "arable-land-pct": "% of land used for crops",
};
const STAT_CAPTIONS: Readonly<Record<string, { label: string; unit: string }>> = {
  population: { label: "Population", unit: "People" },
  "area-km2": { label: "Total area", unit: "km²" },
  gdp: { label: "Total GDP", unit: "USD" },
  "gdp-per-capita": { label: "GDP/person", unit: "USD" },
  "urban-population-pct": { label: "City living", unit: "% of people" },
  "forest-coverage-pct": { label: "Forest cover", unit: "% of land" },
  "internet-users-pct": { label: "Internet use", unit: "% of people" },
  "life-expectancy": { label: "Life expectancy", unit: "Years" },
  "fertility-rate": { label: "Fertility", unit: "Children / woman" },
  "population-density": { label: "Density", unit: "People / km²" },
  latitude: { label: "Furthest north", unit: "Latitude" },
  "arable-land-pct": { label: "Farmland", unit: "% of land" },
};
export const WORLD_RANK_LABEL = "World rank: #1 = highest value";
export const WORLD_RANK_EXPLANATION = "Ranks compare countries with available data. Lower rank numbers are better.";
export function worldRankQuality(rank: number, of: number): string {
  if (!Number.isInteger(rank) || !Number.isInteger(of) || rank < 1 || rank > of) return "";
  if (rank <= of * 0.1) return "Great rank";
  if (rank <= of * 0.25) return "Strong rank";
  if (rank <= of * 0.5) return "Mid rank";
  return "Weak rank";
}
export function statWording(slug: string): string { return STAT_WORDING[slug] ?? slug; }
export function statDefinition(slug: string): string { return STAT_DEFINITIONS[slug] ?? ""; }
export function statLabel(slug: string): string { return STAT_CAPTIONS[slug]?.label ?? statWording(slug); }
export function statUnit(slug: string): string { return STAT_CAPTIONS[slug]?.unit ?? ""; }
export function isComplete(state: BlindPickGame): boolean { return state.placements.length >= state.config.countries.length; }
export function currentIndex(state: BlindPickGame): number { return Math.min(state.placements.length, state.config.countries.length - 1); }
export function slotOwner(state: BlindPickGame, slot: number): number { return state.placements.indexOf(slot); }
export function canUndo(state: BlindPickGame): boolean {
  return state.config.countries.length === PICK_COUNT && !state.undoUsed && state.placements.length > 0;
}
