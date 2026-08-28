import { countries } from "@/lib/data/loader";
import { seededShuffle, seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

interface Round {
  options: Country[];
  correctIndex: number;
}

export interface StreakState {
  queue: Country[];
  // All rounds precomputed up front from the seeded RNG, stored in state. This
  // keeps the daily deterministic across a progress RESUME (the rng used to be
  // re-created at position 0 on reload, so distractors diverged from the seed).
  rounds: Round[];
  currentIndex: number;
  options: Country[];
  correctIndex: number;
  streak: number;
  bestStreak: number;
  phase: "playing" | "gameover";
}

function generateRound(target: Country, rng: () => number): Round {
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
  const rounds = queue.map((target) => generateRound(target, rng));

  return {
    queue,
    rounds,
    currentIndex: 0,
    options: rounds[0].options,
    correctIndex: rounds[0].correctIndex,
    streak: 0,
    bestStreak: 0,
    phase: "playing",
  };
}

export function answerStreak(state: StreakState, optionIndex: number): StreakState {
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

  const next = state.rounds[nextIdx];
  return {
    ...state,
    currentIndex: nextIdx,
    options: next.options,
    correctIndex: next.correctIndex,
    streak: state.streak + 1,
    bestStreak: Math.max(state.bestStreak, state.streak + 1),
  };
}
