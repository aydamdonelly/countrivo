import type { Metadata } from "next";
import { getGameBySlug } from "@/lib/data/registry";

/**
 * Per-game SEO copy. Titles are kept keyword-rich but human and always end with
 * "| Countrivo". Descriptions are written for search intent (~155 chars) and
 * draw on the registry for factual game framing. `genre`/`playMode` feed the
 * VideoGame structured data; `rules` feed the FAQPage structured data.
 *
 * NOTE: facts (country counts, stat categories) come from the game definitions
 * themselves — no invented statistics.
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
  "country-draft": {
    title: "Country Draft — Assign Countries to Their Best Stat | Countrivo",
    description:
      "8 countries, 8 stat categories. Assign each country to where it ranks highest in the world and beat the optimal score. Free daily strategy puzzle.",
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
    title: "Flag Quiz — Guess the Country from Its Flag | Countrivo",
    description:
      "Name the country from its flag across 10 rounds. A free flag quiz with daily challenges and unlimited practice. 243 countries, no signup.",
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
    title: "Higher or Lower — Guess Which Country Ranks Higher | Countrivo",
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
  "capital-match": {
    title: "Capital Match — Match Countries to Their Capitals | Countrivo",
    description:
      "Given a country, pick its capital city from four options across 10 rounds. Test your world capitals knowledge with a free daily challenge.",
    genre: "Geography Quiz",
    playMode: "SinglePlayer",
    rules: [
      "A country is shown with its flag",
      "Pick the correct capital from 4 options",
      "10 questions per round",
      "Score equals correct answers out of 10",
    ],
  },
  "population-sort": {
    title: "Population Sort — Rank Countries by the Numbers | Countrivo",
    description:
      "Sort countries from highest to lowest by population, GDP, area and more. Every position counts. Free daily ranking puzzle with unlimited practice.",
    genre: "Geography Ranking",
    playMode: "SinglePlayer",
    rules: [
      "A set of countries is shown in random order",
      "A stat category is given, such as population or GDP",
      "Rearrange the countries from highest to lowest",
      "Submit when you are confident in your order",
    ],
  },
  "country-streak": {
    title: "Country Streak — How Long Can Your Flag Streak Last? | Countrivo",
    description:
      "Identify countries from their flags one after another. One wrong answer ends the run. How far can your streak go? Free flag game, no signup.",
    genre: "Geography Quiz",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown on screen",
      "Pick the correct country from 4 options",
      "Each correct answer extends your streak",
      "One wrong answer ends the game",
    ],
  },
  "border-buddies": {
    title: "Border Buddies — Name Every Neighboring Country | Countrivo",
    description:
      "A country appears — can you name every country that borders it? Test your knowledge of national borders with a free daily challenge and practice mode.",
    genre: "Geography Knowledge",
    playMode: "SinglePlayer",
    rules: [
      "A country is shown with its flag",
      "Type the names of all bordering countries",
      "Use the autocomplete dropdown to select matches",
      "Find every border or give up to reveal the answer",
    ],
  },
  "continent-sprint": {
    title: "Continent Sprint — Name Every Country on a Continent | Countrivo",
    description:
      "Pick a continent and name every country in it against the clock — Europe, Asia, Africa, the Americas and more. Free geography sprint, no signup.",
    genre: "Geography Speed",
    playMode: "SinglePlayer",
    rules: [
      "Choose a continent to start",
      "Type country names as fast as you can",
      "The timer counts up with no time limit",
      "Finish when you have found them all or give up",
    ],
  },
  "stat-guesser": {
    title: "Stat Guesser — Guess the Country Statistic | Countrivo",
    description:
      "What is the population of Brazil or the GDP of Norway? Guess the exact value across 5 rounds — closer is better. Free daily geography trivia.",
    genre: "Geography Trivia",
    playMode: "SinglePlayer",
    rules: [
      "A country and stat category are shown",
      "Enter your best guess for the value",
      "Your score is based on percentage error",
      "Play 5 rounds — the lowest average error wins",
    ],
  },
  "speed-flags": {
    title: "Speed Flags — 20-Second Flag Quiz Challenge | Countrivo",
    description:
      "Twenty seconds on the clock — how many flags can you identify? A fast-paced flag quiz where speed and accuracy both count. Free, no signup.",
    genre: "Geography Speed",
    playMode: "SinglePlayer",
    rules: [
      "A flag is shown with 2 country options",
      "Pick the correct country as fast as you can",
      "A 20-second countdown runs the whole round",
      "Score equals total correct answers",
    ],
  },
  "odd-one-out": {
    title: "Odd One Out — Spot the Country That Doesn't Belong | Countrivo",
    description:
      "Four countries, one hidden trait. Three belong together and one doesn't — can you spot the odd one out? Free daily geography puzzle, no signup.",
    genre: "Geography Puzzle",
    playMode: "SinglePlayer",
    rules: [
      "Four countries are displayed with their flags",
      "Three share a common trait such as continent or region",
      "Pick the one country that does not belong",
      "Play 5 rounds per game",
    ],
  },
  supremacy: {
    title: "Supremacy — Country Stat Card Battle Game | Countrivo",
    description:
      "A Top Trumps style card battle with real country data. Pick the stat category, compare cards and outsmart the AI across 5 rounds. Free, no signup.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "Each player gets 5 country cards with real stats",
      "The attacker picks a stat category to compare",
      "Both cards are revealed — the higher value wins the round",
      "Players alternate who picks for 5 rounds",
      "Whoever wins the most rounds takes the game",
    ],
  },
  borderline: {
    title: "Borderline — Race Through Country Borders to a Target | Countrivo",
    description:
      "Start at one country and navigate through national borders to reach a target. Knowing who borders whom wins. Free geography path puzzle, no signup.",
    genre: "Geography Strategy",
    playMode: "SinglePlayer",
    rules: [
      "You start at a random country with a target destination",
      "Type the name of a bordering country to move there",
      "Keep moving through borders until you reach the target",
      "Try to match the optimal, shortest path length",
    ],
  },
  blitz: {
    title: "Blitz — Type the Country Before Time Runs Out | Countrivo",
    description:
      "A flag appears — type the country name as fast as you can across 10 rounds of pure speed. Beat your own time. Free flag typing game, no signup.",
    genre: "Geography Speed",
    playMode: "SinglePlayer",
    rules: [
      "A flag appears on screen — identify the country",
      "Type the country name and press Enter",
      "A correct answer wins the round; a wrong one lets you retry",
      "After 10 rounds, see your final score and average time",
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
  // Defensive fallback for an unseeded slug — uses the registry copy directly.
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
    title: seo.title,
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
