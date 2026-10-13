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
      "Country Draft is a free daily strategy game about filling a cabinet. Each of five rounds offers three countries. Open one to meet three of its famous people, choose one person and give them a job: the Chair, the Field, the Purse, the Voice or the Desk.",
      "The person earns points for their fit with the job and a fame bonus. Their points and the reason appear after you confirm the appointment. Each job can be used once. Bonuses reward a cabinet of plausible fits, people from three world regions and a mix of earlier and recent eras.",
      "Everyone gets the same country choices each day. The board resets at midnight Berlin time, and the maximum is 195 points. No account is needed. After finishing, you can add a name to the leaderboard or keep your result private.",
    ],
    faq: [
      { q: "Is this the game where you draft five people and conquer 195 countries?", a: "Yes. Choose a country, pick a person, give them a job. After five rounds, your cabinet earns a score out of 195 and paints that many countries on the map." },
      { q: "How is the score out of 195 worked out?", a: "Each appointment earns up to 25 for the job and up to 10 for fame. Five appointments can reach 175. Three cabinet bonuses add up to 20 more: eight for every job being a plausible fit, six for three regions and six for mixing eras." },
      { q: "When do I see the points?", a: "After you confirm Seat. Choosing a person or selecting a job is safe to change. A confirmed appointment is final, so the reveal cannot be used to try every person before deciding." },
      { q: "Can I choose the country?", a: "Yes. Every round offers three countries from at least two world regions. Select one, then tap Open. You cannot switch countries after opening it." },
      { q: "Is there a random bonus?", a: "No. Identical appointments earn the same score. The daily board is shared, and the cabinet bonuses follow from the people you choose." },
      { q: "Can I play more than once a day?", a: "You get one daily run per device. Practice offers fresh boards without affecting the daily leaderboard." },
      { q: "What happened to the game about placing countries on statistics?", a: "That game is now Blind Pick. Six countries arrive one at a time and you place them on six world rankings, trying to match the perfect board." },
    ],
  },
  "blind-pick": {
    about: [
      "Blind Pick is a daily geography strategy game. Six statistics are on the board, from most people and largest economy to most forest or most internet use. Six countries then arrive one at a time, and for each one you decide which open stat it should take. The catch: you do not know which countries are still to come, so every placement is a bet on what the rest of the board will look like.",
      "Every rank is a rank among the 195 sovereign states, so a slot reads like #12 of 193. Blind Pick is scored like golf: the game finds the perfect board for the same six countries and counts how many ranks you finished over it. Perfect is zero, par is +10. Everyone gets the same six countries on the same day, one shot each, and the result sits on the global board until midnight in Berlin.",
    ],
    faq: [
      { q: "How is Blind Pick scored?", a: "Each country scores the rank it holds on the stat you placed it on. Your six ranks are added up and compared with the lowest total the board allows. The difference is your score: Perfect, or +N over perfect. Par is +10." },
      { q: "Can I play Blind Pick more than once a day?", a: "The daily board is one shot. Practice mode gives you a fresh, random board as often as you like, and practice runs never touch the leaderboard." },
      { q: "Is Blind Pick the same as the game where you draft five people and conquer 195 countries?", a: "No. That one is Country Draft, the cabinet draft, at countrivo.com/games/country-draft. Blind Pick is about placing real countries on the statistics where they rank highest, and it carried the Country Draft name until August 2026." },
    ],
  },
  "flag-quiz": {
    about: [
      "Flag Quiz is a free daily flag game: ten flags of sovereign states, four names each, easy to hard. Everyone gets the same ten flags that day, so your points compare directly with every other player's. Practice mode deals new flags every time and never repeats today's daily answers.",
      "The last three flags are true lookalikes and count double, for a maximum of 13 points. After each one a single line tells the family apart, so you learn to tell Chad from Romania and Indonesia from Monaco instead of guessing.",
    ],
    faq: [
      { q: "Which flags are in the flag quiz?", a: "The flags of the world's sovereign states: the 193 UN members plus the Holy See and Palestine. The first three flags of a run are widely known, the next four test a region, and the last three come from lookalike families." },
      { q: "How is the flag quiz scored?", a: "Flags 1 to 7 score one point each and flags 8 to 10, the lookalikes, score two. The maximum is 13 and par is 9. There is no clock, and your first tap on each flag counts." },
      { q: "Is there a daily flag quiz?", a: "Yes. The daily board shows the same ten flags to everyone and resets at midnight Berlin time. Practice mode is unlimited." },
    ],
  },
  "geo-wordle": {
    about: [
      "GeoWordle is a free geography Wordle where you guess a hidden country in six tries. Instead of matching letters, you follow distance and direction clues. A world map plots your guesses, and words such as warm or hot show how close they are. You can play in your browser on a phone, tablet or computer without an account or download.",
      "Choose the daily puzzle to solve the same country as everyone else, or unlimited practice for a fresh puzzle after every round. The daily resets at midnight Europe/Berlin time. Share your result without revealing the answer, then compare guesses with friends.",
    ],
    faq: [
      { q: "Can I play GeoWordle unlimited?", a: "Yes. Choose unlimited practice below the Play daily button. Each new round hides another country and gives you six guesses. Practice is free and does not affect the daily leaderboard." },
      { q: "How do the distance and direction clues work?", a: "Distances approximate the nearest mapped borders using Natural Earth 1:50m geometry, rounded to kilometres. Neighbours show 0 km. A territory without a mapped border uses centre distance and says so on its row. The arrow is the bearing from the guessed country's reference centre toward the answer's reference centre. Warm and hot describe distance, not the probability of being correct." },
      { q: "When does today's GeoWordle reset?", a: "A new daily country arrives at midnight Europe/Berlin time. Everyone gets the same answer for that day. Finish today's puzzle once, then choose practice to keep playing while you wait." },
      { q: "Is GeoWordle the same as Worldle or Globle?", a: "GeoWordle on Countrivo is a separate country guessing game. This version starts with a hidden country and a world map, then gives you distance and direction clues after each guess. You have six attempts, with a daily puzzle and unlimited practice. No country silhouette is given as the starting clue." },
      { q: "What is a good first guess?", a: "Start with a country you can place confidently on the map. Use both the distance and the arrow to choose your next region, then compare all your clues. If a guess is thousands of kilometres away, move to the indicated region before trying neighbouring countries." },
      { q: "How many guesses do I get?", a: "Six in both daily and practice. After two misses, you may spend one guess to see an outline clue. Solving in fewer used guesses ranks higher on the daily board. After a win or loss, the game reveals the answer on the map." },
      { q: "Is GeoWordle free without signing up?", a: "Yes. Daily and unlimited practice are free. Countrivo has no accounts. After finishing the daily, you can optionally add a name to the leaderboard." },
    ],
  },
  "higher-or-lower": {
    about: [
      "Higher or Lower with countries: one statistic a day and ten calls along a chain of eleven countries. Is the next country higher or lower than the one before it? After each call the country you just called becomes the next one to beat, so the number moves up and down all the way. A wrong call costs you the point, not the run.",
      "It starts easy and gets close fast. The first pair is far apart, the last ones sit a few places from each other in the world ranking, and calls 8 to 10 count double. Everyone plays the same chain each day, so scores out of 13 compare directly. Par is 9.",
    ],
    faq: [
      { q: "How is Higher or Lower scored?", a: "Calls 1 to 7 are worth 1 point and calls 8 to 10 are worth 2, so a perfect day is 13. A wrong call scores nothing but the run carries on to call 10." },
      { q: "Which stats appear?", a: "One a day, rotating through population, total area, total GDP, GDP per person, life expectancy, urban share, internet use, forest cover and fertility, ranked over sovereign states from public sources such as the World Bank. Each statistic appears at least seven days apart. The game shows its dataset year." },
      { q: "Can I practice Higher or Lower?", a: "Yes. Practice is an endless chain on any stat other than today's, and one wrong call ends the streak. It never affects the daily board." },
    ],
  },
  "stat-guesser": {
    about: [
      "Stat Guesser is geography trivia with numbers. Five rounds, each a country and a statistic: what is the population of Brazil, the GDP per person of Norway, the forest cover of Finland. You slide a pin along a ruler, with two well-known countries marked for scale, and the closer you land, the more points you score. It is the game for people who like being roughly right about the world.",
    ],
    faq: [
      { q: "How is Stat Guesser scored?", a: "Up to 100 points a round. On population, area and GDP, being twice off still scores 70 and ten times off scores 0. On percentages, every point off costs 4. The last round counts double, so 600 is the maximum and par is 300." },
      { q: "Which statistics appear in Stat Guesser?", a: "Population, area, GDP, GDP per person, the share of people living in cities, the share of people online and forest cover, from public sources such as the World Bank." },
    ],
  },
  "speed-flags": {
    about: [
      "Speed Flags is the thirty-second flag quiz: two names per flag, as many right as you can before the timer ends. A wrong answer costs three seconds, so guessing fast does not pay. Practice only, built for repetition.",
    ],
    faq: [{ q: "Is Speed Flags a daily game?", a: "No, Speed Flags is practice only: unlimited runs, no leaderboard." }],
  },
};

export function getGameCopy(slug: string): GameCopy | null {
  return GAME_COPY[slug] ?? null;
}
