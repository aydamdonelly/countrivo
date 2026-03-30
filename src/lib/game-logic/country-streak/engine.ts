import { countries } from "@/lib/data/loader";
import { seededShuffle, seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

export interface StreakState {
  queue: Country[];
  currentIndex: number;
  options: Country[];
  correctIndex: number;
  streak: number;
  bestStreak: number;
  phase: "playing" | "gameover";
}

function generateRound(target: Country, rng: () => number): { options: Country[]; correctIndex: number } {
  const distractors = seededPick(
    countries.filter((c) => c.iso3 !== target.iso3),
    3,
    rng
  );
  const all = [target, ...distractors];
  const shuffled = seededShuffle(all, rng);
  return {
    options: shuffled,
    correctIndex: shuffled.findIndex((c) => c.iso3 === target.iso3),
  };
}

export function createStreak(rng: () => number): StreakState {
  const queue = seededShuffle([...countries], rng);
  const first = queue[0];
  const { options, correctIndex } = generateRound(first, rng);

  return {
    queue,
    currentIndex: 0,
    options,
    correctIndex,
    streak: 0,
    bestStreak: 0,
    phase: "playing",
  };
}

export function answerStreak(state: StreakState, optionIndex: number, rng: () => number): StreakState {
  if (state.phase !== "playing") return state;

  const isCorrect = optionIndex === state.correctIndex;

  if (!isCorrect) {
    return {
      ...state,
      phase: "gameover",
      bestStreak: Math.max(state.bestStreak, state.streak),
    };
  }

  const nextIdx = state.currentIndex + 1;
  if (nextIdx >= state.queue.length) {
    return {
      ...state,
      streak: state.streak + 1,
      bestStreak: Math.max(state.bestStreak, state.streak + 1),
      phase: "gameover",
    };
  }

  const nextCountry = state.queue[nextIdx];
  const { options, correctIndex } = generateRound(nextCountry, rng);

  return {
    ...state,
    currentIndex: nextIdx,
    options,
    correctIndex,
    streak: state.streak + 1,
    bestStreak: Math.max(state.bestStreak, state.streak + 1),
  };
}
