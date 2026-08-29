import type { Metadata } from "next";
import { getGameBySlug } from "@/lib/data/registry";

/**
 * Per-game SEO copy. Titles are kept keyword-rich but human and always end with
 * "| Countrivo". Descriptions are written for search intent (~155 chars) and
 * draw on the registry for factual game framing. `genre`/`playMode` feed the
 * VideoGame structured data; `rules` feed the FAQPage structured data.
 *
 * NOTE: facts (country counts, stat categories) come from the game definitions
 * themselves: no invented statistics.
 */
interface GameSeo {
  /** Full <title>, ends with "| Countrivo". */
  title: string;
  /** Meta description tuned for search snippets. */
  description: string;
  /** schema.org VideoGame genre. */
  genre: string;
  /** schema.org playMode (SinglePlayer / MultiPlayer). */
  playMode: string;
  /** FAQPage / how-to steps. Falls back to none if omitted. */
  rules: string[];
}

const GAME_SEO: Record<string, GameSeo> = {
  "geo-wordle": {
    title: "GeoWordle: Daily Country Wordle, Guess the Mystery Country | Countrivo",
    description:
      "A daily geography Wordle. Guess the hidden country: each try reveals the distance and direction to the answer. Solve it in six. Free, no signup.",
    genre: "Geography Puzzle",
    playMode: "SinglePlayer",
    rules: [
      "A mystery country is hidden each day",
      "Type a country to guess it",
      "Each guess shows the distance and a direction arrow to the answer",
      "Use the clues to narrow down the country",
      "Solve it in six guesses or fewer",
    ],
  },
  "country-draft": {
    title: "Country Draft: Draft 5 People, Conquer 195 Countries | Countrivo",
    description:
      "Five countries, five rounds. Each country offers three of its people: take one and give them a seat in your cabinet. Score out of 195. Free daily game, no signup.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "Five countries are on the board from the first second",
      "Every round is one of them, and it offers three of its people",
      "Give them one of five seats, the seat decides most of the points",
      "After five appointments the cabinet is scored out of 195",
    ],
  },
  "blind-pick": {
    title: "Blind Pick: Which Country Ranks Highest? Daily Stats Puzzle | Countrivo",
    description:
      "Eight world rankings are open and eight countries arrive one at a time. Put each country on the stat where it ranks highest. Free daily puzzle, no signup.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "8 stat categories are shown upfront",
      "Countries are revealed one by one",
      "Assign each country to its strongest category",
      "Your score is compared to the mathematically optimal assignment",
    ],
  },
  "flag-quiz": {
    title: "Flag Quiz: Guess the Country by Its Flag, Free Daily Flag Game | Countrivo",
    description:
      "Name the country from its flag across 10 rounds. A free flag quiz with a daily board and unlimited practice. 243 countries, no signup.",
    genre: "Geography Quiz",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown on screen",
      "Pick the correct country from 4 options",
      "10 questions per round",
      "Score equals correct answers out of 10",
    ],
  },
  "higher-or-lower": {
    title: "Higher or Lower: Which Country Ranks Higher? Free Daily Game | Countrivo",
    description:
      "Two countries, one stat. Guess which ranks higher in population, GDP, area and more. Keep the streak alive. Free daily geography game, no signup.",
    genre: "Geography Ranking",
    playMode: "SinglePlayer",
    rules: [
      "Two countries are shown with a stat category",
      "The left country's value is revealed",
      "Guess whether the right country is higher or lower",
      "One wrong answer ends your streak",
    ],
  },
  "stat-guesser": {
    title: "Stat Guesser: Guess Country Statistics, Daily Geography Trivia | Countrivo",
    description:
      "What is the population of Brazil or the GDP of Norway? Guess the exact value across 5 rounds: closer is better. Free daily geography trivia.",
    genre: "Geography Trivia",
    playMode: "SinglePlayer",
    rules: [
      "A country and stat category are shown",
      "Enter your best guess for the value",
      "Your score is based on percentage error",
      "Play 5 rounds: the lowest average error wins",
    ],
  },
  "speed-flags": {
    title: "Speed Flags: Name as Many Flags as You Can in 20 Seconds | Countrivo",
    description:
      "Twenty seconds on the clock: how many flags can you identify? A fast-paced flag quiz where speed and accuracy both count. Free, no signup.",
    genre: "Geography Speed",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown with 2 country options",
      "Pick the correct country as fast as you can",
      "A 20-second countdown runs the whole round",
      "Score equals total correct answers",
    ],
  },
};

const SITE_URL = "https://countrivo.com";

/**
 * Structured-data props for <GameJsonLd>, derived from the same source as the
 * page metadata so the two never drift apart.
 */
export interface GameJsonLdData {
  name: string;
  title: string;
  description: string;
  url: string;
  genre: string;
  playMode: string;
  rules: string[];
}

function getSeo(slug: string): GameSeo {
  const seo = GAME_SEO[slug];
  if (seo) return seo;
  // Defensive fallback for an unseeded slug: uses the registry copy directly.
  const game = getGameBySlug(slug);
  const title = game?.title ?? slug;
  return {
    title: `${title} | Countrivo`,
    description: game?.description ?? game?.shortDescription ?? title,
    genre: "Geography Game",
    playMode: "SinglePlayer",
    rules: [],
  };
}

/**
 * Build Next.js page Metadata for a single game landing page. Pulls the human
 * title from the registry, layers on keyword-rich SEO copy, sets the canonical
 * to /games/{slug} and mirrors title/description into Open Graph and Twitter.
 */
export function buildGameMetadata(slug: string): Metadata {
  const game = getGameBySlug(slug);
  const seo = getSeo(slug);
  const path = `/games/${slug}`;
  const ogTitle = game?.title ? `${game.title} | Countrivo` : seo.title;

  return {
    // seo.title already includes "| Countrivo"; use `absolute` so the layout's
    // "%s | Countrivo" template doesn't append the brand a second time.
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Countrivo",
      url: `${SITE_URL}${path}`,
      title: ogTitle,
      description: seo.description,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: seo.description,
    },
  };
}

/**
 * Build the props for <GameJsonLd> (BreadcrumbList + VideoGame + FAQPage) for a
 * single game, sourced from the registry + the same SEO copy as the metadata.
 */
export function buildGameJsonLd(slug: string): GameJsonLdData {
  const game = getGameBySlug(slug);
  const seo = getSeo(slug);
  const title = game?.title ?? slug;
  return {
    name: `${title} | Countrivo`,
    title,
    description: game?.description ?? seo.description,
    url: `/games/${slug}`,
    genre: seo.genre,
    playMode: seo.playMode,
    rules: seo.rules,
  };
}
