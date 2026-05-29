import { countries } from "@/lib/data/loader";
import { seededShuffle, seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

export interface SpeedFlagsQuestion {
  country: Country;
  options: [Country, Country];
  correctIdx: 0 | 1;
}

export interface SpeedFlagsState {
  queue: SpeedFlagsQuestion[];
  currentIdx: number;
  correct: number;
  total: number;
  timeLeft: number;
  /** Absolute wall-clock ms when the round ends. Null until the game starts.
   *  timeLeft is derived from this so a reload can't pause the clock. */
  endsAt: number | null;
  phase: "ready" | "playing" | "results";
}

const DURATION_MS = 20_000;

export function createSpeedFlags(rng: () => number, queueSize = 100): SpeedFlagsState {
  const shuffled = seededShuffle([...countries], rng);
  const queue: SpeedFlagsQuestion[] = [];

  for (let i = 0; i < queueSize; i++) {
    const country = shuffled[i % shuffled.length];

    // Pick one distractor from a different region for variety
    const others = countries.filter((c) => c.iso3 !== country.iso3);
    const [distractor] = seededPick(others, 1, rng);

    // Randomly place correct answer at index 0 or 1
    const correctIdx = (Math.floor(rng() * 2) as 0 | 1);
    const options: [Country, Country] =
      correctIdx === 0 ? [country, distractor] : [distractor, country];

    queue.push({ country, options, correctIdx });
  }

  return {
    queue,
    currentIdx: 0,
    correct: 0,
    total: 0,
    timeLeft: DURATION_MS / 1000,
    endsAt: null,
    phase: "ready",
  };
}

export function startGame(state: SpeedFlagsState, now: number): SpeedFlagsState {
  return { ...state, phase: "playing", endsAt: now + DURATION_MS, timeLeft: DURATION_MS / 1000 };
}

export function answer(state: SpeedFlagsState, chosenIdx: number): SpeedFlagsState {
  if (state.phase !== "playing") return state;
  if (state.currentIdx >= state.queue.length) return state;

  const isCorrect = chosenIdx === state.queue[state.currentIdx].correctIdx;

  return {
    ...state,
    correct: state.correct + (isCorrect ? 1 : 0),
    total: state.total + 1,
    currentIdx: state.currentIdx + 1,
  };
}

export function tick(state: SpeedFlagsState, now: number): SpeedFlagsState {
  if (state.phase !== "playing" || state.endsAt === null) return state;

  const remainingMs = state.endsAt - now;
  if (remainingMs <= 0) {
    return { ...state, timeLeft: 0, phase: "results" };
  }
  return { ...state, timeLeft: Math.ceil(remainingMs / 1000) };
}
