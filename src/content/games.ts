/**
 * Human copy per game for the landings (blueprint 7.3, 10.5): the one-line rule that
 * becomes the card's how-text, the three facts that become its chips, the four rules of
 * "How it works", and the related games. The rules and relatedGames are carried verbatim
 * from the deleted per-slug landing pages; the how-lines and facts are section 10.5.
 *
 * Prose (about, faq) stays in src/lib/seo/game-copy.ts and the titles and descriptions in
 * src/lib/seo/game-metadata.ts; neither is duplicated here.
 */

export interface GameContent {
  /** The one-line rule (blueprint 10.5): the landing card's how-text. */
  how: string;
  /** Three facts, rendered as the card's chips. */
  facts: readonly [string, string, string];
  /** "How it works": four steps, verbatim from the old landing pages. */
  rules: readonly string[];
  /** Four related slugs; omitted falls back to DEFAULT_RELATED minus the game itself. */
  related?: readonly string[];
}

/** The default four, in order, minus whichever game is being read (blueprint 7.3 step 8). */
export const DEFAULT_RELATED = [
  "country-draft",
  "higher-or-lower",
  "geo-wordle",
  "flag-quiz",
  "capital-match",
  "cluster",
] as const;

export const GAME_CONTENT: Record<string, GameContent> = {
  "country-draft": {
    how: "Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot.",
    facts: ["8 stats", "8 countries", "3 to 5 min"],
    rules: [
      "Eight stat categories are shown up front",
      "Countries are revealed one by one, so you never know what is still to come",
      "Assign each country to the open stat where it ranks best",
      "Your total is compared with the mathematically optimal assignment",
    ],
    related: ["world-draft", "higher-or-lower", "stat-guesser", "cluster"],
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
    how: "A hidden country. Every guess tells you how far and which way. Six tries.",
    facts: ["6 tries", "237 countries", "1 to 2 min"],
    rules: [
      "A mystery country is hidden each day",
      "Type a country to make a guess",
      "Each guess shows the distance and a direction arrow to the answer",
      "Narrow it down and solve it in six guesses or fewer",
    ],
  },
  cluster: {
    how: "Sixteen countries, four hidden groups of four. Four mistakes and it's over.",
    facts: ["16 countries", "4 groups", "4 mistakes"],
    rules: [
      "Sixteen countries are shown in a grid",
      "Four hidden groups of four each share one connection",
      "Tap four countries you think belong together and submit",
      "A correct group locks in; four wrong guesses end the game",
    ],
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
  "risk-zone": {
    how: "Call higher or lower, bank the pot or push for more. One wrong call wipes the chain.",
    facts: ["5 chains", "x5 max", "1 to 2 min"],
    rules: [
      "A country's stat value is shown, guess if the next is higher or lower",
      "Each correct guess grows your multiplier and your pot",
      "Bank the pot to lock the points, or push your luck for one more reveal",
      "One wrong guess wipes the chain, play 5 chains for the highest total",
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
  "capital-match": {
    how: "Ten countries, four capitals each.",
    facts: ["10 countries", "4 options", "2 to 3 min"],
    rules: [
      "A country is shown with its flag",
      "Pick the correct capital from 4 options",
      "10 questions per round",
      "Score: correct answers out of 10",
    ],
  },
  "population-sort": {
    how: "Six countries. Put them in order, highest first.",
    facts: ["6 countries", "1 stat", "2 to 4 min"],
    rules: [
      "6 countries are shown in random order",
      "A stat category is given (e.g., Population, GDP)",
      "Rearrange countries from highest to lowest",
      "Submit when you're confident in your order",
    ],
  },
  "country-streak": {
    how: "Name the flag. Keep going till you miss.",
    facts: ["243 flags", "4 options", "till you miss"],
    rules: [
      "A flag is shown on screen",
      "Pick the correct country from 4 options",
      "Correct answers extend your streak",
      "One wrong answer ends the run",
    ],
  },
  "border-buddies": {
    how: "One country. Name every neighbour.",
    facts: ["1 country", "all borders", "2 to 4 min"],
    rules: [
      "A country is shown with its flag",
      "Type the names of all bordering countries",
      "Use the autocomplete dropdown to select matches",
      "Find all borders or give up to see the answer",
    ],
  },
  "continent-sprint": {
    how: "Pick a continent. Name every country in it, on the clock.",
    facts: ["5 continents", "on the clock", "3 to 10 min"],
    rules: [
      "Choose a continent to start",
      "Type country names as fast as you can",
      "Timer counts up. No time limit",
      "Finish when you've found them all or give up",
    ],
  },
  "odd-one-out": {
    how: "Four countries, three share a trait. Find the one that doesn't.",
    facts: ["5 rounds", "4 countries", "3 to 5 min"],
    rules: [
      "Four countries are displayed with their flags",
      "Three share a common trait (continent, region, first letter, etc.)",
      "Pick the one that doesn't belong",
      "5 rounds per game",
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
  supremacy: {
    how: "Five cards, five stats, the AI on the other side.",
    facts: ["5 rounds", "5 stats", "vs AI"],
    rules: [
      "You and your opponent each hold a hand of country cards",
      "Each round a stat category is revealed",
      "Pick the country you think ranks higher on it",
      "Five rounds; most rounds won takes the match",
    ],
    related: ["country-draft", "higher-or-lower", "stat-guesser", "risk-zone"],
  },
  borderline: {
    how: "Cross borders from start to target in as few steps as you can.",
    facts: ["start to target", "fewest steps", "2 to 5 min"],
    rules: [
      "Two countries are shown: where you start and where you need to get to",
      "Pick a neighbouring country to cross one border",
      "Keep crossing until you reach the target",
      "Fewer borders crossed means a better score",
    ],
    related: ["border-buddies", "odd-one-out", "geo-wordle", "country-draft"],
  },
  blitz: {
    how: "Type the country before the next flag.",
    facts: ["10 flags", "typed", "2 to 3 min"],
    rules: [
      "A flag or capital appears on screen",
      "Type the country name and press Enter",
      "Ten rounds per run",
      "Speed and accuracy both count toward the score",
    ],
    related: ["speed-flags", "flag-quiz", "capital-match", "country-draft"],
  },
  "world-draft": {
    how: "Draft five people. Give each a seat: leader, general, money, propaganda, diplomacy. Then send them out and count how many of the 195 countries they take. Same draft for everyone, one shot.",
    facts: ["5 people", "195 countries", "in development"],
    rules: [],
    related: ["country-draft", "higher-or-lower", "stat-guesser", "cluster"],
  },
};

export function getGameContent(slug: string): GameContent | null {
  return GAME_CONTENT[slug] ?? null;
}

/** The four related slugs for a landing: the game's own list, else the default six minus itself. */
export function relatedSlugs(slug: string): string[] {
  const own = GAME_CONTENT[slug]?.related;
  if (own && own.length > 0) return own.slice(0, 4);
  return DEFAULT_RELATED.filter((s) => s !== slug).slice(0, 4);
}
