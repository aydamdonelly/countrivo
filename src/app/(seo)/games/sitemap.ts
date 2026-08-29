import type { MetadataRoute } from "next";
import { getAllGames } from "@/lib/data/games";
import { BASE_URL, lastModifiedFor } from "@/app/sitemap";

// Shard: https://countrivo.com/games/sitemap.xml (one landing page per game).
// Route groups do not change URLs, so living in (seo) next to the landings it
// describes keeps the same URL shape it served from src/app/games/sitemap.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return getAllGames().map((game) => ({
    url: `${BASE_URL}${game.route}`,
    lastModified: lastModifiedFor(`game:${game.slug}`),
  }));
}
