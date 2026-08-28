import { gameRegistry, getGameBySlug } from "@/lib/data/registry";

/**
 * Plain-prose entity block for game landing pages.
 *
 * Server-rendered declarative facts about one game: definition, mechanic,
 * skill trained, duration, price, daily reset window, coverage. Written so a
 * human reading the bottom of the page learns something concrete — and so an
 * answer engine can extract it without executing JavaScript.
 *
 * Rules for editing: never refer to a game with a pronoun (the extracted
 * sentence has to stand alone), and never state a mechanic that is not already
 * in the registry description.
 */

interface GameEntityCopy {
  /** Completes "{Title} is a daily geography game in which players …" */
  mechanic: string;
  /** Completes "{Title} trains …" */
  skill: string;
}

const TOTAL_COUNTRIES = 243;

const ENTITY_COPY: Record<string, GameEntityCopy> = {
  "country-draft": {
    mechanic:
      "are shown eight countries one at a time and must assign each country to the one category, out of eight, where that country ranks highest globally",
    skill:
      "comparative ranking — knowing not just a country's statistics but where those statistics place the country against every other country",
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
      "an intuition for relative scale — how countries actually compare on population, area, GDP and other measures",
  },
  "capital-match": {
    mechanic:
      "are given a country and pick its correct capital city from four options, over ten rounds",
    skill: "capital-city recall",
  },
  "population-sort": {
    mechanic:
      "drag five countries into order from highest to lowest on a given statistic, scored on how close the ordering is",
    skill:
      "ordering countries by statistics, which is harder than recognising them one at a time",
  },
  "country-streak": {
    mechanic:
      "identify countries from their flags and keep answering until one wrong answer ends the run",
    skill: "flag recall sustained over a long run, where a single lapse ends it",
  },
  "border-buddies": {
    mechanic:
      "are shown one country and must name every country that shares a border with it, with every miss counted",
    skill:
      "knowledge of which countries neighbour which — the part of a mental map that quizzes rarely test",
  },
  "continent-sprint": {
    mechanic:
      "pick a continent and name every country in that continent as fast as possible against a running clock",
    skill: "complete recall of the country list for a whole continent",
  },
  "stat-guesser": {
    mechanic:
      "are asked for a real figure — the population of Brazil, the GDP of Norway — and type a numeric guess, scoring on how close that guess lands",
    skill:
      "numeric estimation: getting the order of magnitude right when the exact number is unknown",
  },
  "speed-flags": {
    mechanic:
      "have twenty seconds on the clock to identify as many flags as possible, with speed and accuracy both counting",
    skill: "instant flag recognition, fast enough to answer without deliberating",
  },
  "odd-one-out": {
    mechanic:
      "are shown four countries, three of which share a trait, and must find the one country that does not belong",
    skill:
      "spotting what a set of countries has in common, then finding the exception",
  },
  supremacy: {
    mechanic:
      "play a card battle on real country data, choosing which stat category to compare and trying to outsmart the AI opponent across five rounds",
    skill:
      "judging which statistic a country wins on before committing to the comparison",
  },
  borderline: {
    mechanic:
      "start at a random country and move from neighbour to neighbour across shared borders until reaching a target country, trying to match the optimal path",
    skill:
      "route-finding across a mental map of land borders, not just knowing where countries are",
  },
  blitz: {
    mechanic:
      "see a flag and type the country's name as fast as possible, over ten rounds",
    skill: "fast recall and correct spelling of country names under time pressure",
  },
  "geo-wordle": {
    mechanic:
      "get six guesses to find a hidden mystery country, with each guess revealing how far away that country is and which direction to head next",
    skill:
      "deduction from distance and bearing — narrowing a whole world down to one country",
  },
  cluster: {
    mechanic:
      "sort sixteen countries into four hidden groups of four, locking in each quartet they believe shares a connection such as a region, a starting letter or a statistical extreme, with four mistakes ending the game",
    skill:
      "finding the hidden connection between countries when several plausible groupings compete",
  },
  "risk-zone": {
    mechanic:
      "make higher-or-lower calls one country at a time, growing a multiplier with every correct call and choosing whether to bank the pot or gamble on one more reveal, across five chains",
    skill:
      "ranking judgement combined with risk management — knowing when a streak is worth more than another guess",
  },
};

export function GameEntityBlock({ slug }: { slug: string }) {
  const game = getGameBySlug(slug);
  if (!game) return null;

  const copy = ENTITY_COPY[slug];
  if (!copy) return null;

  const { title, difficulty, category, estimatedTime } = game;
  const hasDaily = game.availableModes.includes("daily");
  const hasPractice = game.availableModes.includes("practice");

  const modes = hasDaily
    ? hasPractice
      ? "Daily challenge and unlimited practice"
      : "Daily challenge"
    : "Unlimited practice";

  return (
    <section
      aria-labelledby="about-game"
      className="mt-4 px-4 sm:px-0 pb-12 max-w-2xl mx-auto"
    >
      <h2 id="about-game" className="font-bold text-lg mb-3">
        {title} in numbers
      </h2>

      <div className="space-y-3 text-sm text-cream-muted leading-relaxed">
        <p>
          <strong className="text-cream font-semibold">{title}</strong> is a{" "}
          {hasDaily ? "daily " : ""}geography game in which players {copy.mechanic}.
        </p>

        <p>
          {title} trains {copy.skill}. A single round of {title} takes{" "}
          {estimatedTime}, and {title} is free to play in any web browser — no
          signup, no download, no payment.
        </p>

        {hasDaily ? (
          <p>
            {title} has a daily challenge: every player in the world gets the
            same puzzle on the same day, and the {title} puzzle resets at
            midnight Europe/Berlin time.
            {hasPractice
              ? ` Outside the daily challenge, ${title} can be played an unlimited number of times in practice mode.`
              : ""}
          </p>
        ) : (
          <p>
            {title} has no daily challenge. {title} runs in practice mode only
            and can be played an unlimited number of times, drawing a new set of
            countries on every run.
          </p>
        )}

        <p>
          {title} draws on Countrivo&apos;s data set of all {TOTAL_COUNTRIES}{" "}
          countries and territories, so no country is out of scope.
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm border border-border rounded-xl p-4 bg-surface-elevated">
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Game</dt>
          <dd className="font-medium">{title}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Type</dt>
          <dd className="font-medium capitalize">Geography {category} game</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Modes</dt>
          <dd className="font-medium">{modes}</dd>
        </div>
        {hasDaily && (
          <div className="flex gap-2">
            <dt className="text-cream-muted shrink-0">Daily reset</dt>
            <dd className="font-medium">Midnight, Europe/Berlin</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Session length</dt>
          <dd className="font-medium">{estimatedTime}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Difficulty</dt>
          <dd className="font-medium capitalize">{difficulty}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Countries covered</dt>
          <dd className="font-medium">{TOTAL_COUNTRIES}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-cream-muted shrink-0">Price</dt>
          <dd className="font-medium">Free, no account required</dd>
        </div>
      </dl>

      <p className="mt-5 text-sm text-cream-muted leading-relaxed">
        Countrivo is a free browser-based geography game platform with{" "}
        {gameRegistry.length} daily games covering {TOTAL_COUNTRIES} countries.
      </p>
    </section>
  );
}
