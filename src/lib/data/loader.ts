import countriesData from "@/data/countries.json";
import categoriesData from "@/data/categories.json";
import gameRegistryData from "@/data/game-registry.json";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";
import type { GameMeta } from "@/types/game";

export const countries: Country[] = countriesData as Country[];
export const categories: Category[] = categoriesData as Category[];
export const gameRegistry: GameMeta[] = gameRegistryData as GameMeta[];

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
