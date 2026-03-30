import { countries } from "@/lib/data/loader";
import capitalsData from "@/data/capitals.json";
import { seededShuffle, seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

const capitals: Record<string, string> = capitalsData;

export interface CapitalQuestion {
  country: Country;
  options: string[];
  correctIndex: number;
  correctCapital: string;
}

export interface CapitalMatchState {
  questions: CapitalQuestion[];
  currentQuestion: number;
  answers: (number | null)[];
  score: number;
  phase: "playing" | "results";
}

export function createCapitalMatch(rng: () => number, count = 10): CapitalMatchState {
  // Only use countries that have known capitals
  const withCapitals = countries.filter(
    (c) => capitals[c.iso3] && capitals[c.iso3].length > 0
  );

  const selected = seededPick(withCapitals, count, rng);

  const questions: CapitalQuestion[] = selected.map((country) => {
    const correctCapital = capitals[country.iso3];

    // Get distractor capitals from same region preferably
    const sameRegion = withCapitals.filter(
      (c) => c.region === country.region && c.iso3 !== country.iso3
    );
    const others = withCapitals.filter((c) => c.iso3 !== country.iso3);
    const distractorPool = sameRegion.length >= 3 ? sameRegion : others;
    const distractors = seededPick(distractorPool, 3, rng).map(
      (c) => capitals[c.iso3]
    );

    const allOptions = [correctCapital, ...distractors];
    const shuffled = seededShuffle(allOptions, rng);
    const correctIndex = shuffled.indexOf(correctCapital);

    return { country, options: shuffled, correctIndex, correctCapital };
  });

  return {
    questions,
    currentQuestion: 0,
    answers: new Array(count).fill(null),
    score: 0,
    phase: "playing",
  };
}

export function answerCapital(state: CapitalMatchState, optionIndex: number): CapitalMatchState {
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
