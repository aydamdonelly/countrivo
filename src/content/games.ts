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
    how: "Choose a country, pick one of its people, then give them the job that fits their career. Job fit and fame earn the points.",
    steps: ["choose one of three countries", "pick a person and an open job", "seat them to reveal their points"],
    facts: ["5 rounds", "5 jobs", "out of 195"],
    chips: SEAT_CHIPS,
    rules: [
      "Each round offers three countries. Choose one, then open it",
      "Choose one of that country's three people",
      "Choose an open job to appoint the person and reveal their points",
      "Each person scores up to 25 for how well the job fits their career and up to 10 for fame",
      "Fill five jobs and collect bonuses for no bad fits, three world regions and two eras",
    ],
    related: ["blind-pick", "higher-or-lower", "geo-wordle", "stat-guesser"],
  },
  "blind-pick": {
    how: "Place eight countries on eight categories. Find the lowest total world rank. One undo.",
    steps: ["Countries arrive one by one", "#1 means the highest value", "use each category once for the lowest total rank"],
    facts: ["8 countries", "1 undo", "par +10"],
    rules: [
      "Eight categories are shown up front, and the mix changes each day",
      "Eight countries arrive one at a time. Future countries stay hidden",
      "Each category explains its measure and unit. World rank #1 means the highest value among countries with available data",
      "Place each country on an open category. You can undo your latest placement once, even after the eighth country",
      "Choose See result to finish. The best fit uses these same eight countries, each exactly once, for the lowest total world rank. Your score is Perfect, or +N extra rank points above it",
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
  "pinpoint": {
    how: "Five countries. Tap where they are.",
    steps: ["No borders, no labels.", "Closer taps score more.", "The last one counts double."],
    facts: ["5 countries", "Par 720", "About 2 minutes"],
    rules: ["Tap the blank coastline map to place your pin", "Adjust your pin, then choose Drop pin", "Inside the country or within 25 km scores 200; further misses lose points by distance and countries passed", "Five rounds, with the last worth double. Maximum 1,200. Approximate borders from Natural Earth."],
    related: ["geo-wordle", "country-draft", "flag-quiz", "stat-guesser"],
  },
  "geo-wordle": {
    how: "Find the hidden country in six guesses.",
    steps: ["Guess any country.", "Follow distance and direction.", "Neighbours read 0 km."],
    facts: ["6 guesses", "Par 4", "About 2 minutes"],
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
    how: "Twenty seconds. Name as many flags as you can.",
    steps: ["Four names per flag. The clock starts when you press Start.", "A wrong answer costs two seconds.", "Everyone gets the same flags today. Most flags wins."],
    facts: ["20 seconds", "Par 8 flags", "4 names per flag"],
    rules: [
      "The clock starts when you press Start and runs for 20 seconds",
      "A flag appears with four country names. Tap the right one",
      "A wrong answer takes 2 seconds off the clock",
      "Your score is the number of flags you named. Par is 8",
      "Everyone gets the same flags each day. Equal scores share a rank",
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
 * here until the next run. The current roster needs none right now.
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

/** The four related slugs for a landing: the game's own list, else the default list minus itself. */
export function relatedSlugs(slug: string): string[] {
  const own = GAME_CONTENT[slug]?.related;
  if (own && own.length > 0) return own.slice(0, 4);
  return DEFAULT_RELATED.filter((s) => s !== slug).slice(0, 4);
}
