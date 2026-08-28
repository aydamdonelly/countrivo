import countriesData from "@/data/countries.json";
import categoriesData from "@/data/categories.json";
import centroidsData from "@/data/centroids.json";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

export const countries: Country[] = countriesData as Country[];
export const categories: Category[] = categoriesData as Category[];

// Country centroids [lat, lng] for distance/bearing games (geo-wordle).
// 237/243 countries (6 disputed/dependency territories lack a centroid).
// Regenerate with: npx tsx scripts/fetch-centroids.ts
// [lat, lng] per iso3 (typed as number[] — the JSON infers number[] not a tuple).
export const centroids: Record<string, number[]> =
  centroidsData as Record<string, number[]>;

// gameRegistry now lives in the lightweight "@/lib/data/registry" module so
// client components can access it without dragging in countries/categories JSON.
export { gameRegistry } from "./registry";

// These are loaded dynamically since they're large
let _ranks: Record<string, Record<string, number>> | null = null;
let _stats: Record<string, Record<string, number | null>> | null = null;

export async function getRanks(): Promise<Record<string, Record<string, number>>> {
  if (!_ranks) {
    _ranks = (await import("@/data/ranks.json")).default;
  }
  return _ranks!;
}

export async function getStats(): Promise<Record<string, Record<string, number | null>>> {
  if (!_stats) {
    _stats = (await import("@/data/stats.json")).default;
  }
  return _stats!;
}
