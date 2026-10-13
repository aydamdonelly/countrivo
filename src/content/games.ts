/**
 * Human copy per game for the landings (blueprint 7.3, 10.5): the one-line rule that
 * becomes the card's how-text, the three facts that become its chips, the four rules of
 * "How it works", and the related games. The rules and relatedGames are carried verbatim
 * from the deleted per-slug landing pages; the how-lines and facts are section 10.5.
 *
 * Prose (about, faq) stays in src/lib/seo/game-copy.ts and the titles and descriptions in
 * src/lib/seo/game-metadata.ts; neither is duplicated here.
 */
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
    how: "Six countries arrive one at a time. Put each one on the stat where it ranks highest among sovereign states. Scored like golf.",
    steps: ["6 stats are on the board", "countries arrive one by one", "put each where it ranks highest"],
    facts: ["6 stats", "6 countries", "par +10"],
    chips: ["Most people", "Largest area", "Largest economy", "Most urban", "Most forest", "Most internet use"],
    rules: [
      "Six stats are shown up front",
      "Six countries arrive one at a time, so you never know what is still to come",
      "Tap the open stat where the country ranks highest; the tap is final",
      "Your ranks are compared with the perfect board: Perfect, or +N over it",
    ],
    related: ["country-draft", "higher-or-lower", "stat-guesser", "geo-wordle"],
  },
  "higher-or-lower": {
    how: "Ten calls on one number. Is the next country higher or lower? A wrong call doesn't end it.",
    facts: ["10 calls", "1 stat a day", "par 9"],
    rules: [
      "One stat a day and eleven countries in a chain",
      "The left country's value is shown; call whether the right one is higher or lower",
      "The right country then becomes the next left card, whether you were right or wrong",
      "Calls 1 to 7 score 1 point and calls 8 to 10 score 2, so 13 is perfect and par is 9",
      "Practice is endless on any other stat, and one wrong call ends the streak",
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
    how: "Guess five numbers about the world.",
    facts: ["5 rounds", "Par 300", "About 2 minutes"],
    rules: [
      "Slide the pin to your guess",
      "Two well-known countries are marked for scale",
      "Up to 100 points a round, more the closer you land",
      "The last round counts double",
    ],
  },
  "flag-quiz": {
    how: "Ten flags. Name them.",
    steps: ["Four names per flag.", "It gets harder as you go.", "The last three count double."],
    facts: ["10 flags", "Par 9", "About 90 seconds"],
    rules: [
      "Ten flags of sovereign states, easy to hard",
      "Tap one of four names. Your first tap counts",
      "Flags 8 to 10 are lookalikes and count double",
      "Points of 13. Par is 9",
    ],
  },
  "speed-flags": {
    how: "Thirty seconds. Two names per flag. A wrong one costs 3 seconds.",
    facts: ["30 s", "2 options", "1 min"],
    rules: [
      "A flag is shown with 2 country names",
      "Pick the right one as fast as you can",
      "30-second countdown timer",
      "A wrong answer takes 3 seconds off the clock",
      "Score: the number of flags you get right",
    ],
  },
};

/**
 * Row metas that correct a registry `shortDescription` the rebuild contradicts (blueprint
 * 8.9). The JSON itself is only ever rewritten by the data scripts, so a correction lives
 * here until the next run. The six-game roster needs none right now.
 */
const HUB_META: Record<string, string> = {
  "speed-flags": "30 seconds. How many flags can you name?",
};

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
