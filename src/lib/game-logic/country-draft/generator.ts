import { countries, categories } from "@/lib/data/loader";
import ranksData from "@/data/ranks.json";
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import { solveAssignment } from "@/lib/assignment-solver";
import type { DraftGameConfig } from "./types";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const ranks: Record<string, Record<string, number>> = ranksData;

const GAME_SIZE = 8;

// Categories that work well for the game (high coverage, interesting variance)
const PREFERRED_CATEGORIES = [
  "population", "area-km2", "gdp-per-capita", "gdp", "life-expectancy",
  "urban-population-pct", "internet-users-pct",
  "fertility-rate", "tourism-arrivals", "forest-coverage-pct",
  "unemployment-rate", "renewable-energy-pct",
  "beer-consumption-per-capita", "coffee-consumption-per-capita",
  "wine-consumption-per-capita", "inflation-rate", "arable-land-pct",
  "education-spending-pct", "health-spending-pct", "fdi-inflow",
];

function getEligibleCategories(): Category[] {
  return categories.filter((c) => PREFERRED_CATEGORIES.includes(c.slug));
}

function getEligibleCountries(selectedCategories: Category[]): Country[] {
  // Only include countries that have rank data for ALL selected categories
  return countries.filter((country) => {
    const countryRanks = ranks[country.iso3];
    if (!countryRanks) return false;
    return selectedCategories.every((cat) => countryRanks[cat.slug] !== undefined);
  });
}

function hasEnoughContinentDiversity(selected: Country[]): boolean {
  const continents = new Set(selected.map((c) => c.continent));
  return continents.size >= 3;
}

export function generateDraftConfig(
  rng: () => number,
  mode: "daily" | "practice",
  dateKey: string
): DraftGameConfig {
  // 1. Pick 8 categories
  const eligibleCats = getEligibleCategories();
  const selectedCategories = seededPick(eligibleCats, GAME_SIZE, rng);

  // 2. Find countries with data for all selected categories
  const eligible = getEligibleCountries(selectedCategories);

  // 3. Pick 8 countries with continent diversity
  let selectedCountries: Country[] = [];
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidates = seededPick(eligible, GAME_SIZE, rng);
    if (hasEnoughContinentDiversity(candidates)) {
      selectedCountries = candidates;
      break;
    }
  }

  // Fallback: just take what we get if diversity isn't achievable
  if (selectedCountries.length === 0) {
    selectedCountries = seededPick(eligible, GAME_SIZE, rng);
  }

  // 4. Build cost matrix
  const costMatrix: number[][] = [];
  for (const country of selectedCountries) {
    const row: number[] = [];
    for (const cat of selectedCategories) {
      row.push(ranks[country.iso3][cat.slug] || 999);
    }
    costMatrix.push(row);
  }

  // 5. Compute optimal assignment
  const { optimalScore, assignment } = solveAssignment(costMatrix);

  // 6. Shuffle reveal order
  const revealOrder = seededShuffle(
    selectedCountries.map((_, i) => i),
    rng
  );

  const reorderedCountries = revealOrder.map((i) => selectedCountries[i]);
  const reorderedCostMatrix = revealOrder.map((i) => costMatrix[i]);
  const reorderedAssignment = revealOrder.map((i) => assignment[i]);

  // Recompute optimal for reordered matrix to keep assignment indices correct
  const { optimalScore: reoptimalScore, assignment: reoptimalAssignment } =
    solveAssignment(reorderedCostMatrix);

  return {
    countries: reorderedCountries,
    categories: selectedCategories,
    costMatrix: reorderedCostMatrix,
    optimalScore: reoptimalScore,
    optimalAssignment: reoptimalAssignment,
    mode,
    dateKey,
  };
}
