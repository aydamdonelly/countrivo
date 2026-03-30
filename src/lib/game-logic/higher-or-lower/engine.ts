import { countries, categories } from "@/lib/data/loader";
import ranksData from "@/data/ranks.json";
import statsData from "@/data/stats.json";
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const ranks: Record<string, Record<string, number>> = ranksData;
const stats: Record<string, Record<string, number | null>> = statsData;

export interface HoLRound {
  left: Country;
  right: Country;
  category: Category;
  leftValue: number;
  rightValue: number;
  answer: "higher" | "lower"; // is right higher or lower than left?
}

export interface HoLState {
  rounds: HoLRound[];
  currentRound: number;
  streak: number;
  bestStreak: number;
  phase: "playing" | "reveal" | "gameover";
  lastAnswer: "correct" | "wrong" | null;
}

const GOOD_CATEGORIES = [
  "population", "area-km2", "gdp-per-capita", "gdp", "life-expectancy",
  "urban-population-pct", "internet-users-pct", "fertility-rate",
  "tourism-arrivals", "forest-coverage-pct",
];

export function createHoL(rng: () => number, roundCount = 20): HoLState {
  const usableCategories = categories.filter((c) =>
    GOOD_CATEGORIES.includes(c.slug)
  );
  const rounds: HoLRound[] = [];

  for (let i = 0; i < roundCount; i++) {
    const cat = usableCategories[Math.floor(rng() * usableCategories.length)];
    const eligible = countries.filter(
      (c) =>
        stats[c.iso3]?.[cat.slug] !== undefined &&
        stats[c.iso3]?.[cat.slug] !== null
    );
    const pair = seededPick(eligible, 2, rng);
    if (pair.length < 2) continue;

    const leftVal = stats[pair[0].iso3][cat.slug] as number;
    const rightVal = stats[pair[1].iso3][cat.slug] as number;

    rounds.push({
      left: pair[0],
      right: pair[1],
      category: cat,
      leftValue: leftVal,
      rightValue: rightVal,
      answer: rightVal >= leftVal ? "higher" : "lower",
    });
  }

  return {
    rounds,
    currentRound: 0,
    streak: 0,
    bestStreak: 0,
    phase: "playing",
    lastAnswer: null,
  };
}

export function guess(state: HoLState, choice: "higher" | "lower"): HoLState {
  if (state.phase !== "playing" || state.currentRound >= state.rounds.length) return state;

  const round = state.rounds[state.currentRound];
  const isCorrect = choice === round.answer;

  if (isCorrect) {
    const newStreak = state.streak + 1;
    return {
      ...state,
      streak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      currentRound: state.currentRound + 1,
      phase: state.currentRound + 1 >= state.rounds.length ? "gameover" : "playing",
      lastAnswer: "correct",
    };
  }

  return {
    ...state,
    phase: "gameover",
    lastAnswer: "wrong",
  };
}
