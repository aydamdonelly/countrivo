import { isPlayable } from "@/games/registry";
import { getAllGames } from "@/lib/data/registry";
import { isGameSlug, type GameSlug } from "@/ui/types";

/**
 * The day's anchor daily: Country Draft, the game the home is built around, as soon as its
 * board exists, and until then the first daily in registry order that has one. Social
 * surfaces offer a shot only where there is something to shoot, so no row here ever points
 * at a game with no play route (server only: `isPlayable` reads the host registry).
 */
export function anchorDailySlug(): GameSlug | null {
  for (const game of getAllGames()) {
    if (!game.availableModes.includes("daily")) continue;
    if (!isGameSlug(game.slug) || !isPlayable(game.slug)) continue;
    return game.slug;
  }
  return null;
}

/** `/games/blind-pick/play?mode=daily`, or null when no daily has a board. */
export function anchorPlayHref(): string | null {
  const slug = anchorDailySlug();
  return slug ? `/games/${slug}/play?mode=daily` : null;
}
