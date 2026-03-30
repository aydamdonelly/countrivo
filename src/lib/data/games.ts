import { gameRegistry } from "./loader";
import type { GameMeta } from "@/types/game";

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
