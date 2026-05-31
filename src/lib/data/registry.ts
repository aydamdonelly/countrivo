import gameRegistryData from "@/data/game-registry.json";
import type { GameMeta } from "@/types/game";

// Lightweight registry module: imports ONLY game-registry.json (~7KB).
// Safe for "use client" components — does NOT pull in countries.json/categories.json.
export const gameRegistry: GameMeta[] = gameRegistryData as GameMeta[];

const bySlug = new Map(gameRegistry.map((g) => [g.slug, g]));

export function getAllGames(): GameMeta[] {
  return gameRegistry;
}

export function getGameBySlug(slug: string): GameMeta | undefined {
  return bySlug.get(slug);
}

export function getFlagshipGame(): GameMeta {
  return gameRegistry.find((g) => g.isFlagship)!;
}

export function getMainGames(): GameMeta[] {
  return gameRegistry.filter((g) => g.tier === "main");
}

export function getDrillGames(): GameMeta[] {
  return gameRegistry.filter((g) => g.tier === "drill");
}
