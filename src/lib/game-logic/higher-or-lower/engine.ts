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
  rng: () => number;
}

const GOOD_CATEGORIES = [
  "population", "area-km2", "gdp-per-capita", "gdp", "life-expectancy",
  "urban-population-pct", "internet-users-pct", "fertility-rate",
  "tourism-arrivals", "forest-coverage-pct",
];

const usableCategories = categories.filter((c) =>
  GOOD_CATEGORIES.includes(c.slug)
);

function generateRound(rng: () => number): HoLRound | null {
  const cat = usableCategories[Math.floor(rng() * usableCategories.length)];
  const eligible = countries.filter(
    (c) =>
      stats[c.iso3]?.[cat.slug] !== undefined &&
      stats[c.iso3]?.[cat.slug] !== null
  );
  const pair = seededPick(eligible, 2, rng);
  if (pair.length < 2) return null;

  const leftVal = stats[pair[0].iso3][cat.slug] as number;
  const rightVal = stats[pair[1].iso3][cat.slug] as number;

  return {
    left: pair[0],
    right: pair[1],
    category: cat,
    leftValue: leftVal,
    rightValue: rightVal,
    answer: rightVal >= leftVal ? "higher" : "lower",
  };
}

function generateBatch(rng: () => number, count: number): HoLRound[] {
  const rounds: HoLRound[] = [];
  for (let i = 0; i < count; i++) {
    const round = generateRound(rng);
    if (round) rounds.push(round);
  }
  return rounds;
}

export function createHoL(rng: () => number): HoLState {
  return {
    rounds: generateBatch(rng, 10),
    currentRound: 0,
    streak: 0,
    bestStreak: 0,
    phase: "playing",
    lastAnswer: null,
    rng,
  };
}

export function guess(state: HoLState, choice: "higher" | "lower"): HoLState {
  if (state.phase !== "playing" || state.currentRound >= state.rounds.length) return state;

  const round = state.rounds[state.currentRound];
  const isCorrect = choice === round.answer;

  if (isCorrect) {
    const newStreak = state.streak + 1;
    const nextRound = state.currentRound + 1;

    // Generate more rounds when running low
    let rounds = state.rounds;
    if (nextRound >= rounds.length - 3) {
      rounds = [...rounds, ...generateBatch(state.rng, 10)];
    }

    return {
      ...state,
      rounds,
      streak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      currentRound: nextRound,
      phase: "playing",
      lastAnswer: "correct",
    };
  }

  return {
    ...state,
    phase: "gameover",
    lastAnswer: "wrong",
  };
}
