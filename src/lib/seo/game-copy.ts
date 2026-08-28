/**
 * Landing-page prose per game: a short "about" (what it is, who it is for, what
 * it trains) and three FAQs. Written for people first and for the queries they
 * actually type (flag quiz, guess the country, geography quiz, country wordle,
 * world capitals quiz, country draft). No invented numbers: counts come from
 * the game definitions.
 */
export interface GameCopy {
  about: string[];
  faq: { q: string; a: string }[];
}

export const GAME_COPY: Record<string, GameCopy> = {
  "country-draft": {
    about: [
      "Country Draft is a daily geography strategy game. Eight statistics are on the board, from population and GDP per person to forest cover or coffee consumption. Eight countries then appear one at a time, and for each one you decide which open stat it should take. The catch: you do not know which countries are still to come, so every pick is a bet on what the rest of the draft will look like.",
      "Your score is the sum of the world ranks you landed. The game then shows the mathematically optimal assignment, so you can see exactly where the draft slipped. Everyone gets the same eight countries on the same day, one shot each, and the result sits on the global board until midnight in Berlin.",
    ],
    faq: [
      { q: "How is Country Draft scored?", a: "Each country scores the rank it holds in the stat you assigned it. Lower ranks are better, and the total is compared with the optimal assignment for that day's board." },
      { q: "Can I play Country Draft more than once a day?", a: "The daily board is one shot. Practice mode gives you a fresh, random board as often as you like, and practice runs never touch the leaderboard." },
      { q: "Is Country Draft the same as the 'draft 5 people, conquer 195 countries' game?", a: "No. That is a different format, which we are building as World Draft. Country Draft is about placing real countries on the statistics where they rank best." },
    ],
  },
  "world-draft": {
    about: [
      "World Draft is Countrivo's version of the draft-a-cabinet, conquer-the-world game: pick five real people, hand each a role, and watch how many of the 195 countries your team can take. It is in development, with the same rules as every Countrivo daily: one draft for everyone, one shot, a score you can share.",
    ],
    faq: [
      { q: "When does World Draft launch?", a: "It is being built now. Country Draft, the daily stats draft, is playable today." },
    ],
  },
  "flag-quiz": {
    about: [
      "Flag Quiz is a free flag game with all 243 countries and territories. A flag appears, you pick the country from four options, ten rounds per run. The daily challenge gives everyone the same ten flags, so your score is comparable with every other player's that day; practice mode shuffles new flags every time.",
      "It is the quickest way to learn the flags of the world: the distractors are chosen to be plausible (similar colours, same region), so you learn to tell Chad from Romania and Indonesia from Monaco instead of guessing.",
    ],
    faq: [
      { q: "How many flags are in the flag quiz?", a: "Every one of the 243 countries and territories on Countrivo has its flag in the pool, including small territories and dependencies." },
      { q: "Is the flag quiz multiple choice?", a: "Yes. Each flag comes with four country names, one correct. Ten flags make a round." },
      { q: "Is there a daily flag quiz?", a: "Yes. The daily challenge shows the same ten flags to everyone and resets at midnight Berlin time. Practice mode is unlimited." },
    ],
  },
  "geo-wordle": {
    about: [
      "GeoWordle is a daily country Wordle. One country is hidden. You type a guess, and the game tells you how far it is from the answer and in which direction. Six guesses to find it. Because every clue is a real distance and bearing, each wrong guess narrows the map: 4,000 km north-east of Brazil is a very different place than 400 km.",
      "The mystery country is the same for everyone each day, so it works as a shared puzzle between friends. Practice mode hides a new country every run.",
    ],
    faq: [
      { q: "How do the clues in GeoWordle work?", a: "After each guess you see the great-circle distance to the hidden country and an arrow pointing toward it. Closer guesses turn warmer." },
      { q: "How many guesses do I get?", a: "Six. Solving it in fewer guesses gives a better score on the daily board." },
      { q: "Is GeoWordle free?", a: "Yes, and no signup is needed. Sign in only if you want your daily result on the global and friends boards." },
    ],
  },
  "higher-or-lower": {
    about: [
      "Higher or Lower with countries: two countries, one statistic, and one question. Does the right one rank higher or lower than the left? Population, land area, GDP per person, life expectancy, tourists, internet use and more rotate through the rounds. One wrong call ends the streak.",
      "It looks simple and gets hard fast, because it tests the comparisons most people never learn: is Vietnam or Turkey more populous, does Norway or Chile have more coastline per person. The daily run gives everyone the same sequence, so streak lengths compare directly.",
    ],
    faq: [
      { q: "What counts as a higher score in Higher or Lower?", a: "Your streak: the number of correct calls before the first miss. The daily board ranks streaks." },
      { q: "Which stats appear?", a: "A rotating set of country statistics: population, area, GDP, life expectancy, tourism, forest cover, internet use and others, all from public sources such as the World Bank." },
      { q: "Can I practice Higher or Lower?", a: "Yes. Practice mode draws new country pairs every run and does not affect the daily board." },
    ],
  },
  "capital-match": {
    about: [
      "Capital Match is a world capitals quiz: a country and its flag appear, you pick the capital from four options, ten rounds. It covers all 243 countries and territories, including the ones people get wrong most (Australia's Canberra, Turkey's Ankara, Switzerland's Bern, Brazil's Brasília).",
    ],
    faq: [
      { q: "Does the capitals quiz cover every country?", a: "Yes, all 243 countries and territories on Countrivo, each with its capital city." },
      { q: "Is there a daily capitals quiz?", a: "Yes. The daily challenge gives everyone the same ten countries; practice mode is unlimited." },
      { q: "Are trick capitals included?", a: "Yes. Countries whose largest city is not the capital appear regularly, because those are the ones worth learning." },
    ],
  },
  "population-sort": {
    about: [
      "Population Sort shows five countries and asks you to put them in order by population. Every position counts, so a near miss still scores. It trains the sense of scale that most geography quizzes skip: knowing that Nigeria has passed 200 million, or that Canada and Poland are closer than they feel.",
    ],
    faq: [
      { q: "How is Population Sort scored?", a: "Each country in the right position scores; the daily board ranks by correct positions and then by how close the rest were." },
      { q: "Where do the population numbers come from?", a: "World Bank figures, refreshed with each data update on Countrivo." },
    ],
  },
  "country-streak": {
    about: [
      "Country Streak is a fast geography quiz with a single rule: keep answering correctly. Questions mix flags, capitals and facts about countries; one wrong answer ends the streak. The daily run is the same question sequence for everyone.",
    ],
    faq: [
      { q: "What kind of questions are in Country Streak?", a: "Flags, capitals, continents and quick facts about the 243 countries and territories on Countrivo." },
      { q: "Is Country Streak timed?", a: "No timer. The pressure is the streak: one miss and the run is over." },
    ],
  },
  "border-buddies": {
    about: [
      "Border Buddies is a borders quiz: a country is shown and you name every country it shares a land border with. Miss one and the round shows you which. It is the fastest way to learn the map itself rather than the trivia around it.",
    ],
    faq: [
      { q: "How many countries have land borders?", a: "Most do; island nations are excluded from Border Buddies because they have none." },
      { q: "Do I need to spell the countries?", a: "You pick from options, so spelling is not part of the challenge." },
    ],
  },
  "continent-sprint": {
    about: [
      "Continent Sprint is a timed geography drill: a continent is chosen and you name as many of its countries as you can before the clock runs out. It is the practice tool for anyone who wants to be able to list every country in Africa, Asia, Europe, the Americas or Oceania from memory.",
    ],
    faq: [
      { q: "How long is a Continent Sprint round?", a: "A short timed run per continent; the score is the number of countries named before time runs out." },
    ],
  },
  "stat-guesser": {
    about: [
      "Stat Guesser is geography trivia with numbers. Five rounds, each a country and a statistic: what is the population of Brazil, the GDP per person of Norway, the forest cover of Finland. You type your guess and the closer you are, the more points you score. It is the game for people who like being roughly right about the world.",
    ],
    faq: [
      { q: "How is Stat Guesser scored?", a: "By how close your guess is to the real value, on a curve, so being in the right order of magnitude already earns points." },
      { q: "Which statistics appear in Stat Guesser?", a: "Population, area, GDP, life expectancy, tourism, energy, land use and more, from public sources such as the World Bank, WHO and UNWTO." },
    ],
  },
  "speed-flags": {
    about: [
      "Speed Flags is the twenty-second flag quiz: as many flags as you can name before the timer ends. Practice only, built for repetition.",
    ],
    faq: [{ q: "Is Speed Flags a daily game?", a: "No, Speed Flags is practice only: unlimited runs, no leaderboard." }],
  },
  "odd-one-out": {
    about: [
      "Odd One Out shows four countries, three of which share a trait: a continent, a language, a border, a statistic. Find the one that does not belong. It rewards knowing countries as places, not just as names.",
    ],
    faq: [{ q: "What traits does Odd One Out use?", a: "Continents, regions, languages, borders, coastlines, and statistics from the Countrivo data set." }],
  },
  "supremacy": {
    about: [
      "Supremacy is a two-player country draft: you and an opponent take turns picking countries, and each pick is scored on a hidden statistic. Outsmart the other side by reading which stats are in play.",
    ],
    faq: [{ q: "Is Supremacy multiplayer?", a: "It is a versus format against an opponent. Practice mode plays against the computer." }],
  },
  "borderline": {
    about: [
      "Borderline is a route puzzle: start in one country and reach the target by moving only across land borders, in as few steps as possible. It turns the world map into a board.",
    ],
    faq: [{ q: "How is Borderline scored?", a: "By the number of borders crossed; the shortest route scores best." }],
  },
  "blitz": {
    about: [
      "Blitz is the typing flag and capital quiz: a prompt appears, you type the country, the fastest correct answers score highest. Practice only.",
    ],
    faq: [{ q: "Is Blitz timed?", a: "Yes. Speed and accuracy both count." }],
  },
  "cluster": {
    about: [
      "Cluster is Connections with countries. Sixteen countries in a grid, four hidden groups of four, one connection each: a region, a first letter, a shared border, a statistic. Tap four you think belong together and submit; four wrong guesses end the run. The daily grid is the same for everyone.",
    ],
    faq: [
      { q: "What connects the groups in Cluster?", a: "Anything true of exactly those four countries: geography, names, borders, or statistics. Some groups overlap on purpose." },
      { q: "How many mistakes are allowed?", a: "Four. The daily board ranks by groups found and mistakes made." },
    ],
  },
  "risk-zone": {
    about: [
      "Risk Zone is a push-your-luck geography game. Guess higher or lower one country at a time; each correct call grows the multiplier. Bank the pot to keep the points or take one more reveal for a bigger one. One wrong call wipes the chain. Five chains, highest total wins the day.",
    ],
    faq: [
      { q: "When should I bank in Risk Zone?", a: "Whenever the next comparison feels like a coin flip. The multiplier rewards confidence, the wipe punishes greed." },
      { q: "Is Risk Zone a daily game?", a: "Yes, one shot a day on the same chains for everyone, plus unlimited practice." },
    ],
  },
};

export function getGameCopy(slug: string): GameCopy | null {
  return GAME_COPY[slug] ?? null;
}
