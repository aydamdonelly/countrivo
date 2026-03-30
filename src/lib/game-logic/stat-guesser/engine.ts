import { countries, categories } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const stats: Record<string, Record<string, number | null>> = statsData;

const GUESS_CATEGORIES = [
  "population", "area-km2", "gdp-per-capita", "gdp", "life-expectancy",
  "urban-population-pct", "internet-users-pct", "fertility-rate",
];

export interface StatGuesserRound {
  country: Country;
  category: Category;
  actualValue: number;
}

export interface StatGuesserState {
  rounds: StatGuesserRound[];
  currentRound: number;
  guesses: (number | null)[];
  scores: (number | null)[]; // percentage error per round
  phase: "playing" | "feedback" | "results";
}

export function createStatGuesser(rng: () => number, roundCount = 5): StatGuesserState {
  const usable = categories.filter((c) => GUESS_CATEGORIES.includes(c.slug));
  const rounds: StatGuesserRound[] = [];

  for (let i = 0; i < roundCount; i++) {
    const cat = usable[Math.floor(rng() * usable.length)];
    const eligible = countries.filter(
      (c) =>
        stats[c.iso3]?.[cat.slug] !== undefined &&
        stats[c.iso3]?.[cat.slug] !== null
    );
    const [country] = seededPick(eligible, 1, rng);
    const actualValue = stats[country.iso3][cat.slug] as number;

    rounds.push({ country, category: cat, actualValue });
  }

  return {
    rounds,
    currentRound: 0,
    guesses: new Array(roundCount).fill(null),
    scores: new Array(roundCount).fill(null),
    phase: "playing",
  };
}

export function submitGuess(state: StatGuesserState, guessValue: number): StatGuesserState {
  if (state.phase !== "playing") return state;

  const round = state.rounds[state.currentRound];
  const percentError =
    round.actualValue === 0
      ? guessValue === 0 ? 0 : 100
      : (Math.abs(guessValue - round.actualValue) / Math.abs(round.actualValue)) * 100;

  const newGuesses = [...state.guesses];
  newGuesses[state.currentRound] = guessValue;

  const newScores = [...state.scores];
  newScores[state.currentRound] = Math.round(percentError * 10) / 10;

  return {
    ...state,
    guesses: newGuesses,
    scores: newScores,
    phase: "feedback",
  };
}

export function nextRound(state: StatGuesserState): StatGuesserState {
  if (state.phase !== "feedback") return state;

  const next = state.currentRound + 1;
  const isComplete = next >= state.rounds.length;

  return {
    ...state,
    currentRound: isComplete ? state.currentRound : next,
    phase: isComplete ? "results" : "playing",
  };
}
