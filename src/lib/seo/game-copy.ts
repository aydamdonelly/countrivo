/**
 * Landing-page prose per game: a short "about" (what it is, who it is for, what
 * it trains) and three FAQs. Written for people first and for the queries they
 * actually type (flag quiz, guess the country, geography quiz, country wordle,
 * country draft). No invented numbers: counts come from
 * the game definitions.
 */
export interface GameCopy {
  about: string[];
  faq: { q: string; a: string }[];
}

export const GAME_COPY: Record<string, GameCopy> = {
  "country-draft": {
    about: [
      "Country Draft is a free daily strategy game about filling a cabinet. Five rounds, and every round is one country: Argentina, then Japan, then Mali. That country puts three of its people on the table, each of a different kind, you take one, and you give that person one of five seats: the Chair, the Field, the Purse, the Voice, the Desk.",
      "Every person carries an archetype and a standing, and both are printed on the card. The seat decides most of the points, the standing decides the rest, and the whole table is published on this page. After five appointments the cabinet is scored out of 195, which is how many of the world's countries it takes.",
      "Everyone gets the same five rounds and the same fifteen people each day, the board resets at midnight Europe/Berlin time, and there is no random bonus anywhere in the score. Outside the daily board, Country Draft can be played an unlimited number of times in practice mode, where nothing counts and the best possible line is shown at the end so the next daily goes better.",
    ],
    faq: [
      { q: "Is this the game where you draft five people and conquer 195 countries?", a: "Yes. Five rounds, five seats, a score out of 195. This one publishes the whole scoring table, shows all five countries from the start so holding a seat is a decision rather than a guess, and has no random bonus, so two identical cabinets always score the same." },
      { q: "How is the score out of 195 worked out?", a: "Each appointment scores the fit between the person's archetype and the seat, 0 to 25, plus their standing, 0 to 10. Five appointments make 0 to 175, and three bonuses add up to 20 more. The full table is on this page." },
      { q: "Is there a random bonus?", a: "No. Nothing in the score is rolled. The only random part of Country Draft is the board, and everybody gets the same board on the same day." },
      { q: "What is the best possible score today?", a: "It depends on the board, and it is shown on your result as the best possible line, appointment by appointment. Boards are generated until that number falls between 166 and 186 out of 195, and until a player who simply takes the biggest number in front of them lands well short of it." },
      { q: "Who is in the roster?", a: "Public figures with a public record, drawn from twelve fields: leaders, commanders, rulers by force, founders and financiers, scientists and explorers, writers and poets, musicians, screen and stage, comedians, athletes, broadcasters and outlaws. Rulers by force and outlaws hold nobody living, and no sitting head of state or government is in the roster at all." },
      { q: "Can I play more than once a day?", a: "The daily board is one shot and it resets at midnight Europe/Berlin time. Practice is unlimited and nothing there touches the leaderboard." },
      { q: "What happened to the old Country Draft?", a: "The game about putting countries on the statistic where they rank best is now Blind Pick, at countrivo.com/games/blind-pick. Nothing about it changed except the name and the address." },
    ],
  },
  "blind-pick": {
    about: [
      "Blind Pick is a daily geography strategy game. Eight statistics are on the board, from population and GDP per person to forest cover or coffee consumption. Eight countries then appear one at a time, and for each one you decide which open stat it should take. The catch: you do not know which countries are still to come, so every pick is a bet on what the rest of the draft will look like.",
      "Your score is the sum of the world ranks you landed. The game then shows the mathematically optimal assignment, so you can see exactly where the draft slipped. Everyone gets the same eight countries on the same day, one shot each, and the result sits on the global board until midnight in Berlin.",
    ],
    faq: [
      { q: "How is Blind Pick scored?", a: "Each country scores the rank it holds in the stat you assigned it. Lower ranks are better, and the total is compared with the optimal assignment for that day's board." },
      { q: "Can I play Blind Pick more than once a day?", a: "The daily board is one shot. Practice mode gives you a fresh, random board as often as you like, and practice runs never touch the leaderboard." },
      { q: "Is Blind Pick the same as the game where you draft five people and conquer 195 countries?", a: "No. That one is Country Draft, the cabinet draft, at countrivo.com/games/country-draft. Blind Pick is about placing real countries on the statistics where they rank best, and it carried the Country Draft name until August 2026." },
    ],
  },
  "flag-quiz": {
    about: [
      "Flag Quiz is a free flag game with all 243 countries and territories. A flag appears, you pick the country from four options, ten rounds per run. The daily board gives everyone the same ten flags, so your score is comparable with every other player's that day; practice mode shuffles new flags every time.",
      "It is the quickest way to learn the flags of the world: the distractors are chosen to be plausible (similar colours, same region), so you learn to tell Chad from Romania and Indonesia from Monaco instead of guessing.",
    ],
    faq: [
      { q: "How many flags are in the flag quiz?", a: "Every one of the 243 countries and territories on Countrivo has its flag in the pool, including small territories and dependencies." },
      { q: "Is the flag quiz multiple choice?", a: "Yes. Each flag comes with four country names, one correct. Ten flags make a round." },
      { q: "Is there a daily flag quiz?", a: "Yes. The daily board shows the same ten flags to everyone and resets at midnight Berlin time. Practice mode is unlimited." },
    ],
  },
  "geo-wordle": {
    about: [
      "GeoWordle is a free geography Wordle where you guess a hidden country in six tries. Instead of matching letters, you follow distance and direction clues. A world map plots the countries you have guessed, and the proximity bars grow longer as you get closer. You can play in your browser on a phone, tablet or computer without an account or download.",
      "Choose the daily puzzle to solve the same country as everyone else, or unlimited practice for a fresh puzzle after every round. The daily resets at midnight Europe/Berlin time. Share your result without revealing the answer, then compare guesses with friends.",
    ],
    faq: [
      { q: "Can I play GeoWordle unlimited?", a: "Yes. Choose unlimited practice below the Play daily button. Each new round hides another country and gives you six guesses. Practice is free and does not affect the daily leaderboard." },
      { q: "How do the distance and direction clues work?", a: "The distance is the great-circle distance between the countries' reference coordinates, rounded to kilometres. It is not the distance between their nearest borders or capitals. The arrow points from your guessed country toward the answer. A longer proximity bar means a closer guess, not a probability of being correct." },
      { q: "When does today's GeoWordle reset?", a: "A new daily country arrives at midnight Europe/Berlin time. Everyone gets the same answer for that day. Finish today's puzzle once, then choose practice to keep playing while you wait." },
      { q: "Is GeoWordle the same as Worldle or Globle?", a: "GeoWordle on Countrivo is a separate country guessing game. This version starts with a hidden country and a world map, then gives you distance and direction clues after each guess. You have six attempts, with a daily puzzle and unlimited practice. No country silhouette is given as the starting clue." },
      { q: "What is a good first guess?", a: "Start with a country you can place confidently on the map. Use both the distance and the arrow to choose your next region, then compare all your clues. If a guess is thousands of kilometres away, move to the indicated region before trying neighbouring countries." },
      { q: "How many guesses do I get?", a: "Six in both daily and practice. Solving in fewer guesses ranks higher on the daily board. After a win or loss, the game reveals the answer on the map." },
      { q: "Is GeoWordle free without signing up?", a: "Yes. Daily and unlimited practice are free, with no signup or download required. An account is optional for saving results and joining the global and friends boards." },
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
};

export function getGameCopy(slug: string): GameCopy | null {
  return GAME_COPY[slug] ?? null;
}
