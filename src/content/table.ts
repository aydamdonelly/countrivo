import { getAllGames } from '@/lib/data/registry';
import { SEAT_NAMES, SEAT_WANTS } from '@/lib/game-logic/country-draft/tables';

export interface GamePresentation {
  slug: string;
  title: string;
  promise: string;
  action?: string;
  steps: readonly [string, string, string];
  minutes: string;
  par: string;
  clay: string;
  idle: string;
  done: string;
  rounds: number;
}

const GAME_PRESENTATIONS: readonly GamePresentation[] = [
  { slug: "country-draft", action: "Build a cabinet", title: "Country Draft", promise: "Draft five famous people. Conquer the world.", steps: ["Pick a country, then one of its people.", "Give them the job that fits their career.", "Score up to 25 for job fit and 10 for fame."], minutes: "About 3 minutes", par: "140", clay: "cl-01", idle: "out", done: "coins", rounds: 5 },
  { slug: "geo-wordle", action: "Find the country", title: "GeoWordle", promise: "Find the hidden country in six guesses.", steps: ["Guess any country.", "Each guess shows how far and which way.", "Use the map to narrow it down."], minutes: "About 2 minutes", par: "4 guesses", clay: "cl-02", idle: "tilt", done: "pressed", rounds: 6 },
  { slug: "pinpoint", action: "Place a country", title: "Pinpoint", promise: "You know the name. Where in the world is it?", steps: ["Find the country on a blank map.", "Drop your pin, then lock it in.", "Five places. The last counts double."], minutes: "About 2 minutes", par: "720", clay: "cl-03", idle: "lean", done: "deep", rounds: 5 },
  { slug: "blind-pick", action: "Match eight categories", title: "Blind Pick", promise: "Eight countries. Eight categories. Find their best fit.", steps: ["Countries arrive one at a time. Use each category once. One undo.", "Each category ranks countries by its value. #1 is the highest.", "Find the lowest total world rank with these same eight countries."], minutes: "About 2 minutes", par: "+10", clay: "cl-07", idle: "lift", done: "flip", rounds: 8 },
  { slug: "higher-or-lower", action: "Compare countries", title: "Higher or Lower", promise: "Ten calls on one number.", steps: ["Is the next country higher or lower?", "A wrong call doesn't end it.", "The last three count double."], minutes: "About 90 seconds", par: "9", clay: "cl-04", idle: "lean", done: "level", rounds: 10 },
  { slug: "stat-guesser", action: "Guess a number", title: "Stat Guesser", promise: "Guess five numbers about the world.", steps: ["Slide the pin to your guess.", "Two countries give you a sense of scale.", "Closer scores more. The last counts double."], minutes: "About 2 minutes", par: "300", clay: "cl-06", idle: "slide", done: "slide", rounds: 5 },
  { slug: "flag-quiz", action: "Name the flag", title: "Flag Quiz", promise: "Ten flags. Name them.", steps: ["Four names per flag.", "It gets harder as you go.", "The last three count double."], minutes: "About 90 seconds", par: "9", clay: "cl-05", idle: "wave1", done: "rosette", rounds: 10 },
  { slug: "speed-flags", action: "30-second sprint", title: "Speed Flags", promise: "Thirty seconds. How many flags do you know?", steps: ["Pick between two country names.", "A wrong answer costs three seconds.", "Go again and beat your own score."], minutes: "30 seconds", par: "10 flags", clay: "cl-08", idle: "t2", done: "empty", rounds: 0 },
];

export const TABLE_GAMES: readonly GamePresentation[] = getAllGames().flatMap(({ slug }) => {
  const game = GAME_PRESENTATIONS.find(item => item.slug === slug);
  return game ? [game] : [];
});

export function gamePresentation(slug: string): GamePresentation | undefined {
  return TABLE_GAMES.find((game) => game.slug === slug);
}

/** The landing job guide uses the game's own job names and descriptions. */
export const CABINET_JOBS = ([
  { slug: "chair", clay: "cl-10" },
  { slug: "field", clay: "cl-11" },
  { slug: "purse", clay: "cl-12" },
  { slug: "voice", clay: "cl-13" },
  { slug: "desk", clay: "cl-14" },
] as const).map((job, index) => ({ ...job, name: SEAT_NAMES[index], description: SEAT_WANTS[index] }));

export function outcomeClay(game: string, score: string): string {
  const value = Number(score.match(/^[+]?(\d+)/)?.[1]);
  if (game === 'GeoWordle') return !Number.isFinite(value) ? 'cl-22' : value <= 3 ? 'cl-20' : 'cl-21';
  if (game === 'Blind Pick') return score === 'Perfect' || value === 0 ? 'cl-20' : value <= 15 ? 'cl-21' : 'cl-22';
  const bands: Record<string, readonly [number, number]> = {'Country Draft':[160,80],Pinpoint:[1000,600],'Flag Quiz':[13,9],'Higher or Lower':[13,9],'Stat Guesser':[480,300],'Speed Flags':[25,15]};
  const band=bands[game];
  return !band || !Number.isFinite(value) ? 'cl-22' : value >= band[0] ? 'cl-20' : value >= band[1] ? 'cl-21' : 'cl-22';
}
