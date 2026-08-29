import type { MetadataRoute } from "next";
import { getAllCountries } from "@/lib/data/countries";
import { getAllGames } from "@/lib/data/games";
import { PAPER } from "@/lib/seo/og-image";

/**
 * Web App Manifest: the installed PWA and the iOS home-screen shortcut read it.
 * `start_url` and `scope` are a contract (an installed shortcut keeps the URL it
 * was installed with), so they stay. Colours are paper, the single theme's
 * ground, taken from the Satori palette mirror so no hex literal lives here.
 * Counts come from the data, never from a number typed into the copy.
 */
export default function manifest(): MetadataRoute.Manifest {
  const games = getAllGames().length;
  const countries = getAllCountries().length;

  return {
    name: "Countrivo: Geography Games",
    short_name: "Countrivo",
    description:
      `Play ${games} geography games. One shot a day, flag quizzes, country rankings ` +
      `and strategy puzzles. ${countries} countries.`,
    id: "/",
    start_url: "/games",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: PAPER,
    theme_color: PAPER,
    categories: ["games", "education", "trivia"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // 180x180 PNG from app/apple-icon.tsx, for platforms that do not render SVG icons.
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
