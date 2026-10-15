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
    title: "GeoWordle: Guess the Country, Daily & Unlimited | Countrivo",
    description:
      "Guess the hidden country in six tries using a map, distance and direction clues. Free daily GeoWordle and unlimited practice. No account or download.",
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
      "Draft 5 people and conquer the world. Choose countries, fill five cabinet jobs and reveal your score out of 195. Free daily game and practice, no account.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "Choose one of three countries each round",
      "Open the country and choose one of its three people",
      "Give the person an open job and confirm to reveal their points",
      "Fill five jobs and earn up to 195 points with cabinet bonuses",
    ],
  },
  "blind-pick": {
    title: "Blind Pick: Which Country Ranks Highest? Stats Practice | Countrivo",
    description:
      "Six countries, six world rankings. Place each country on a stat and compare with the perfect assignment. Unlimited practice, golf scoring, par +10.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "6 stats are shown up front",
      "Countries arrive one at a time",
      "Place each country on the stat where it ranks highest among sovereign states",
      "Your score is how far you finish over the perfect board",
    ],
  },
  "flag-quiz": {
    title: "Flag Quiz: Guess the Country by Its Flag, Free Daily Flag Game | Countrivo",
    description:
      "Name countries from their flags in ten rounds. The final three lookalikes count double. Free daily flag quiz and unlimited practice, no account.",
    genre: "Geography Quiz",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown on screen",
      "Pick the correct country from 4 options",
      "10 questions per round",
      "The first seven flags score one point each, the last three two: maximum 13",
    ],
  },
  "higher-or-lower": {
    title: "Higher or Lower: Which Country Ranks Higher? Free Daily Game | Countrivo",
    description:
      "Ten calls on one stat: is the next country higher or lower in population, GDP, area and more? A wrong call doesn't end it. Free daily geography game, no signup.",
    genre: "Geography Ranking",
    playMode: "SinglePlayer",
    rules: [
      "One stat a day and eleven countries in a chain",
      "The left country's value is shown; call whether the right one is higher or lower",
      "The right country becomes the next left card, whether you were right or wrong",
      "Calls 1 to 7 score 1 point and calls 8 to 10 score 2: 13 is perfect, par is 9",
    ],
  },
  "stat-guesser": {
    title: "Stat Guesser: Guess Country Statistics, Daily Geography Trivia | Countrivo",
    description:
      "What is the population of Brazil or the GDP of Norway? Slide a pin to your guess across 5 rounds: closer scores more. Free daily geography trivia.",
    genre: "Geography Trivia",
    playMode: "SinglePlayer",
    rules: [
      "A country and a stat are shown, with two well-known countries marked on the ruler for scale",
      "Slide the pin to your guess and lock it",
      "Each round scores up to 100 points, more the closer you land",
      "Play 5 rounds: the last counts double, 600 is the maximum and par is 300",
    ],
  },
  "speed-flags": {
    title: "Speed Flags: Name as Many Flags as You Can in 30 Seconds | Countrivo",
    description:
      "Thirty seconds on the clock and two names per flag: how many can you get right? A wrong answer costs three seconds. Free, no signup.",
    genre: "Geography Speed",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown with 2 country names",
      "Pick the right one as fast as you can",
      "A 30-second countdown runs the whole round",
      "A wrong answer takes 3 seconds off the clock",
      "Score equals the number of flags you get right",
    ],
  },
  "pinpoint": {
    title: "Pinpoint: Find Countries on a World Map | Countrivo",
    description: "Place five countries on a world map. Closer pins score more and the last round counts double. Free daily geography game and unlimited practice.",
    genre: "Geography Map Game",
    playMode: "SinglePlayer",
    rules: ["Find the named country on the map", "Place a pin and confirm it", "Closer pins earn more points", "The fifth round counts double, maximum 1200 points"],
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

export function getGameSeo(slug: string): GameSeo {
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
  const seo = getGameSeo(slug);
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
  const seo = getGameSeo(slug);
  const title = game?.title ?? slug;
  return {
    name: title,
    title,
    description: seo.description,
    url: `/games/${slug}`,
    genre: seo.genre,
    playMode: seo.playMode,
    rules: seo.rules,
  };
}
