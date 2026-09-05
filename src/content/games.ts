/**
 * Human copy per game for the landings (blueprint 7.3, 10.5): the one-line rule that
 * becomes the card's how-text, the three facts that become its chips, the four rules of
 * "How it works", and the related games. The rules and relatedGames are carried verbatim
 * from the deleted per-slug landing pages; the how-lines and facts are section 10.5.
 *
 * Prose (about, faq) stays in src/lib/seo/game-copy.ts and the titles and descriptions in
 * src/lib/seo/game-metadata.ts; neither is duplicated here.
 */
import { LANDING_DRAFT_CHIPS } from "./chips";
import { SEAT_CHIPS } from "./draft";
import { guessableCountries } from "@/lib/game-logic/geo-wordle/engine";

export interface GameContent {
  /** The one-line rule (blueprint 10.5): the landing card's how-text. */
  how: string;
  /** Three steps that replace the how-text on the card (blueprint 3.6 `steps`). */
  steps?: readonly [string, string, string];
  /** Three facts, rendered as the card's chips unless `chips` overrides them. */
  facts: readonly [string, string, string];
  /** The card's chips when the game's vocabulary is the better chip row (the five seats). */
  chips?: readonly string[];
  /** "How it works": four steps, verbatim from the old landing pages. */
  rules: readonly string[];
  /** Four related slugs; omitted falls back to DEFAULT_RELATED minus the game itself. */
  related?: readonly string[];
}

/** The default four, in order, minus whichever game is being read (blueprint 7.3 step 8). */
export const DEFAULT_RELATED = [
  "country-draft",
  "blind-pick",
  "higher-or-lower",
  "geo-wordle",
  "stat-guesser",
  "flag-quiz",
] as const;

export const GAME_CONTENT: Record<string, GameContent> = {
  "country-draft": {
    how: "Five rounds, five seats. Each round hands you a country and three people. Pick one, seat them, and take the map.",
    steps: ["five seats sit empty", "each round offers three people", "seat them, take the map"],
    facts: ["5 rounds", "5 seats", "out of 195"],
    chips: SEAT_CHIPS,
    rules: [
      "Five countries are on the board from the first second",
      "Every round is one of them, and it offers three of its people",
      "Give them one of five seats, the seat decides most of the points",
      "After five appointments the cabinet is scored out of 195",
    ],
    related: ["blind-pick", "higher-or-lower", "geo-wordle", "stat-guesser"],
  },
  "blind-pick": {
    how: "Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot.",
    steps: ["8 stats are on the board", "countries appear one by one", "put each where it ranks best"],
    facts: ["8 stats", "8 countries", "3 to 5 min"],
    chips: LANDING_DRAFT_CHIPS,
    rules: [
      "Eight stat categories are shown up front",
      "Countries are revealed one by one, so you never know what is still to come",
      "Assign each country to the open stat where it ranks best",
      "Your total is compared with the mathematically optimal assignment",
    ],
    related: ["country-draft", "higher-or-lower", "stat-guesser", "geo-wordle"],
  },
  "higher-or-lower": {
    how: "Two countries, one stat. Call which ranks higher. One wrong call ends the streak.",
    facts: ["2 countries", "1 stat", "2 to 5 min"],
    rules: [
      "Two countries are shown with a stat category",
      "The left country's value is revealed",
      "Guess if the right country is higher or lower",
      "One wrong answer ends the streak",
    ],
  },
  "geo-wordle": {
    how: "Guess the country in six tries. Each guess gives you a distance and direction. Play free, no signup.",
    facts: ["6 guesses", `${guessableCountries().length} countries`, "unlimited practice"],
    rules: [
      "Start with any country. Type its name and choose it from the suggestions",
      "Read the distance in kilometres and follow the arrow from your guess toward the answer",
      "Compare the clues from each guess to narrow down the map",
      "Find the hidden country in six guesses. A new daily puzzle arrives at midnight Berlin time",
    ],
    related: ["flag-quiz", "higher-or-lower", "blind-pick", "country-draft"],
  },
  "stat-guesser": {
    how: "A country and a stat. Guess the number. Five rounds, closest wins.",
    facts: ["5 rounds", "% error", "3 to 5 min"],
    rules: [
      "A country and stat category are shown",
      "Enter your best guess for the value",
      "Score is based on percentage error",
      "5 rounds per game. Lowest average error wins",
    ],
  },
  "flag-quiz": {
    how: "Ten flags, four names each. Score out of ten.",
    facts: ["10 flags", "4 options", "2 to 3 min"],
    rules: [
      "A flag is shown on screen",
      "Pick the correct country from 4 options",
      "10 questions per round",
      "Score: correct answers out of 10",
    ],
  },
  "speed-flags": {
    how: "Twenty seconds. Two names per flag. Go.",
    facts: ["20 s", "2 options", "1 min"],
    rules: [
      "A flag is shown with 2 country options",
      "Pick the correct country as fast as you can",
      "20-second countdown timer",
      "Score: total correct answers",
    ],
  },
};

/**
 * Row metas that correct a registry `shortDescription` the rebuild contradicts (blueprint
 * 8.9). The JSON itself is only ever rewritten by the data scripts, so a correction lives
 * here until the next run. The six-game roster needs none right now.
 */
const HUB_META: Record<string, string> = {};

/** The row meta for a game: the correction if there is one, else the registry line. */
export function gameMeta(slug: string, shortDescription: string): string {
  return HUB_META[slug] ?? shortDescription;
}

export function getGameContent(slug: string): GameContent | null {
  return GAME_CONTENT[slug] ?? null;
}

/** The four related slugs for a landing: the game's own list, else the default six minus itself. */
export function relatedSlugs(slug: string): string[] {
  const own = GAME_CONTENT[slug]?.related;
  if (own && own.length > 0) return own.slice(0, 4);
  return DEFAULT_RELATED.filter((s) => s !== slug).slice(0, 4);
}
