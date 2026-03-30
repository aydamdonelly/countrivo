import { countries } from "@/lib/data/loader";
import { seededShuffle, seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

export interface FlagQuizQuestion {
  country: Country;
  options: Country[];
  correctIndex: number;
}

export interface FlagQuizState {
  questions: FlagQuizQuestion[];
  currentQuestion: number;
  answers: (number | null)[];
  score: number;
  phase: "playing" | "results";
}

function generateDistractors(
  correct: Country,
  rng: () => number,
  count: number
): Country[] {
  // Prefer countries from same region for harder distractors
  const sameRegion = countries.filter(
    (c) => c.region === correct.region && c.iso3 !== correct.iso3
  );
  const others = countries.filter(
    (c) => c.region !== correct.region && c.iso3 !== correct.iso3
  );

  const pool =
    sameRegion.length >= count
      ? seededPick(sameRegion, count, rng)
      : [
          ...seededPick(sameRegion, Math.min(sameRegion.length, 2), rng),
          ...seededPick(others, count - Math.min(sameRegion.length, 2), rng),
        ];

  return pool.slice(0, count);
}

export function createFlagQuiz(rng: () => number, questionCount = 10): FlagQuizState {
  const selected = seededPick(countries, questionCount, rng);

  const questions: FlagQuizQuestion[] = selected.map((country) => {
    const distractors = generateDistractors(country, rng, 3);
    const allOptions = [country, ...distractors];
    const shuffled = seededShuffle(allOptions, rng);
    const correctIndex = shuffled.findIndex((c) => c.iso3 === country.iso3);

    return { country, options: shuffled, correctIndex };
  });

  return {
    questions,
    currentQuestion: 0,
    answers: new Array(questionCount).fill(null),
    score: 0,
    phase: "playing",
  };
}

export function answerQuestion(state: FlagQuizState, optionIndex: number): FlagQuizState {
  if (state.phase !== "playing") return state;

  const newAnswers = [...state.answers];
  newAnswers[state.currentQuestion] = optionIndex;

  const isCorrect =
    optionIndex === state.questions[state.currentQuestion].correctIndex;
  const newScore = state.score + (isCorrect ? 1 : 0);

  const nextQ = state.currentQuestion + 1;
  const isComplete = nextQ >= state.questions.length;

  return {
    ...state,
    answers: newAnswers,
    score: newScore,
    currentQuestion: isComplete ? state.currentQuestion : nextQ,
    phase: isComplete ? "results" : "playing",
  };
}
