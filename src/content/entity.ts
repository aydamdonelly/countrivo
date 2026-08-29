/**
 * The entity block's copy (blueprint 7.3 step 9, 12): ENTITY_COPY moved verbatim from
 * the deleted src/components/game/game-entity-block.tsx, with the "daily challenge"
 * phrases replaced by "daily board" (blueprint 10.1). Rules for editing, unchanged from
 * the original file: never refer to a game with a pronoun, and never state a mechanic
 * that is not already in the registry description.
 */

export interface GameEntityCopy {
  /** Completes "{Title} is a daily geography game in which players ..." */
  mechanic: string;
  /** Completes "{Title} trains ..." */
  skill: string;
}

export const TOTAL_COUNTRIES = 243;

export const ENTITY_COPY: Record<string, GameEntityCopy> = {
  "country-draft": {
    mechanic:
      "play five rounds, each one a country that puts three of its people on the table, take one of the three and give that person one of five seats in a cabinet that is scored out of 195",
    skill:
      "reading which kind of person fits which job, and holding a seat open for a round or two when the board has not offered the right person for it yet",
  },
  "blind-pick": {
    mechanic:
      "are shown eight countries one at a time and must assign each country to the one category, out of eight, where that country ranks highest globally",
    skill:
      "comparative ranking, knowing not just a country's statistics but where those statistics place the country against every other country",
  },
  "flag-quiz": {
    mechanic:
      "see a national flag and choose the country it belongs to from four options, over ten rounds with no second chances",
    skill: "flag recognition across all 243 countries and territories",
  },
  "higher-or-lower": {
    mechanic:
      "compare two countries on a single statistic and pick which country ranks higher, with one wrong pick ending the streak",
    skill:
      "an intuition for relative scale, how countries actually compare on population, area, GDP and other measures",
  },
  "stat-guesser": {
    mechanic:
      "are asked for a real figure, the population of Brazil, the GDP of Norway, and type a numeric guess, scoring on how close that guess lands",
    skill:
      "numeric estimation: getting the order of magnitude right when the exact number is unknown",
  },
  "speed-flags": {
    mechanic:
      "have twenty seconds on the clock to identify as many flags as possible, with speed and accuracy both counting",
    skill: "instant flag recognition, fast enough to answer without deliberating",
  },
  "geo-wordle": {
    mechanic:
      "get six guesses to find a hidden mystery country, with each guess revealing how far away that country is and which direction to head next",
    skill:
      "deduction from distance and bearing, narrowing a whole world down to one country",
  },
};

/** The "Modes" row of the entity table (blueprint 10.1). */
export function modesLabel(hasDaily: boolean, hasPractice: boolean): string {
  if (!hasDaily) return "Practice only";
  return hasPractice ? "Daily board and unlimited practice" : "Daily board";
}

/** The daily paragraph, with the "daily challenge" wording replaced (blueprint 10.1). */
export function dailyParagraph(title: string, hasPractice: boolean): string {
  const first = `${title} has a daily board: every player in the world gets the same puzzle on the same day, and the ${title} board resets at midnight Europe/Berlin time.`;
  if (!hasPractice) return first;
  return `${first} Outside the daily board, ${title} can be played an unlimited number of times in practice mode.`;
}

/** The practice-only paragraph. */
export function practiceParagraph(title: string): string {
  return `${title} has no daily board. ${title} runs in practice mode only and can be played an unlimited number of times, drawing a new set of countries on every run.`;
}
