import { countries, categories } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const stats: Record<string, Record<string, number | null>> = statsData;

const SORT_CATEGORIES = [
  "population", "area-km2", "gdp-per-capita", "gdp", "life-expectancy",
  "urban-population-pct", "internet-users-pct", "fertility-rate",
];

export interface SortGameState {
  countries: Country[];
  category: Category;
  correctOrder: number[]; // indices into countries array, sorted by stat descending
  userOrder: number[];    // current user ordering
  phase: "playing" | "results";
  score: number;          // number of correctly positioned
}

export function createSortGame(rng: () => number, countryCount = 6): SortGameState {
  const usable = categories.filter((c) => SORT_CATEGORIES.includes(c.slug));
  const cat = usable[Math.floor(rng() * usable.length)];

  const eligible = countries.filter(
    (c) => stats[c.iso3]?.[cat.slug] !== undefined && stats[c.iso3]?.[cat.slug] !== null
  );

  const selected = seededPick(eligible, countryCount, rng);

  // Determine correct order (highest value first)
  const withValues = selected.map((c, i) => ({
    idx: i,
    value: stats[c.iso3][cat.slug] as number,
  }));
  withValues.sort((a, b) => b.value - a.value);
  const correctOrder = withValues.map((v) => v.idx);

  // Start with random order (just use indices 0..n-1)
  const userOrder = selected.map((_, i) => i);

  return {
    countries: selected,
    category: cat,
    correctOrder,
    userOrder,
    phase: "playing",
    score: 0,
  };
}

export function moveItem(state: SortGameState, fromIdx: number, toIdx: number): SortGameState {
  if (state.phase !== "playing") return state;
  const newOrder = [...state.userOrder];
  const [item] = newOrder.splice(fromIdx, 1);
  newOrder.splice(toIdx, 0, item);
  return { ...state, userOrder: newOrder };
}

export function submitSort(state: SortGameState): SortGameState {
  let score = 0;
  for (let i = 0; i < state.userOrder.length; i++) {
    if (state.userOrder[i] === state.correctOrder[i]) score++;
  }
  return { ...state, phase: "results", score };
}
