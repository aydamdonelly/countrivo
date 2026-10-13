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
      "Higher or Lower with countries: one statistic a day and ten calls along a chain of eleven countries. Is the next country higher or lower than the one before it? After each call the country you just called becomes the next one to beat, so the number moves up and down all the way. A wrong call costs you the point, not the run.",
      "It starts easy and gets close fast. The first pair is far apart, the last ones sit a few places from each other in the world ranking, and calls 8 to 10 count double. Everyone plays the same chain each day, so scores out of 13 compare directly. Par is 9.",
    ],
    faq: [
      { q: "How is Higher or Lower scored?", a: "Calls 1 to 7 are worth 1 point and calls 8 to 10 are worth 2, so a perfect day is 13. A wrong call scores nothing but the run carries on to call 10." },
      { q: "Which stats appear?", a: "One a day, rotating through population, land area, total GDP, GDP per person, life expectancy, urban share, internet use, forest cover and fertility, ranked over sovereign states from public sources such as the World Bank. The same stat never comes back within a week." },
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
