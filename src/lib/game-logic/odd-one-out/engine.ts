import { countries } from "@/lib/data/loader";
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

export interface OddOneOutRound {
  countries: Country[];
  oddIndex: number;
  trait: string;
  traitDescription: string;
}

export interface OddOneOutState {
  rounds: OddOneOutRound[];
  currentRound: number;
  answers: (number | null)[];
  score: number;
  phase: "playing" | "feedback" | "results";
}

type TraitGenerator = (rng: () => number) => OddOneOutRound | null;

function byContinentRound(rng: () => number): OddOneOutRound | null {
  const continents = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  const continent = continents[Math.floor(rng() * continents.length)];
  const inGroup = countries.filter((c) => c.continent === continent);
  const outGroup = countries.filter((c) => c.continent !== continent);

  if (inGroup.length < 3 || outGroup.length < 1) return null;

  const three = seededPick(inGroup, 3, rng);
  const [outlier] = seededPick(outGroup, 1, rng);

  const all = [...three, outlier];
  const shuffled = seededShuffle(all, rng);
  const oddIndex = shuffled.findIndex((c) => c.iso3 === outlier.iso3);

  return {
    countries: shuffled,
    oddIndex,
    trait: "continent",
    traitDescription: `The other three are in ${continent}`,
  };
}

function byRegionRound(rng: () => number): OddOneOutRound | null {
  const regions = [...new Set(countries.map((c) => c.region))].filter(Boolean);
  const region = regions[Math.floor(rng() * regions.length)];
  const inGroup = countries.filter((c) => c.region === region);
  const outGroup = countries.filter((c) => c.region !== region);

  if (inGroup.length < 3 || outGroup.length < 1) return null;

  const three = seededPick(inGroup, 3, rng);
  const [outlier] = seededPick(outGroup, 1, rng);

  const all = [...three, outlier];
  const shuffled = seededShuffle(all, rng);
  const oddIndex = shuffled.findIndex((c) => c.iso3 === outlier.iso3);

  return {
    countries: shuffled,
    oddIndex,
    trait: "region",
    traitDescription: `The other three are in ${region}`,
  };
}

function byFirstLetterRound(rng: () => number): OddOneOutRound | null {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const shuffledLetters = seededShuffle(letters, rng);

  for (const letter of shuffledLetters) {
    const inGroup = countries.filter((c) =>
      c.displayName.startsWith(letter)
    );
    const outGroup = countries.filter(
      (c) => !c.displayName.startsWith(letter)
    );

    if (inGroup.length >= 3 && outGroup.length >= 1) {
      const three = seededPick(inGroup, 3, rng);
      const [outlier] = seededPick(outGroup, 1, rng);

      const all = [...three, outlier];
      const shuffled = seededShuffle(all, rng);
      const oddIndex = shuffled.findIndex((c) => c.iso3 === outlier.iso3);

      return {
        countries: shuffled,
        oddIndex,
        trait: "first letter",
        traitDescription: `The other three start with the letter "${letter}"`,
      };
    }
  }

  return null;
}

function byLandlockedRound(rng: () => number): OddOneOutRound | null {
  // Countries with no borders are islands (or special cases)
  const landlocked = countries.filter(
    (c) => c.borders.length === 0
  );
  const notLandlocked = countries.filter(
    (c) => c.borders.length > 0
  );

  // Randomly decide: 3 islands + 1 non-island, or 3 non-islands + 1 island
  if (rng() < 0.5 && landlocked.length >= 3 && notLandlocked.length >= 1) {
    const three = seededPick(landlocked, 3, rng);
    const [outlier] = seededPick(notLandlocked, 1, rng);

    const all = [...three, outlier];
    const shuffled = seededShuffle(all, rng);
    const oddIndex = shuffled.findIndex((c) => c.iso3 === outlier.iso3);

    return {
      countries: shuffled,
      oddIndex,
      trait: "island nations",
      traitDescription: "The other three are island nations (no land borders)",
    };
  }

  if (notLandlocked.length >= 3 && landlocked.length >= 1) {
    const three = seededPick(notLandlocked, 3, rng);
    const [outlier] = seededPick(landlocked, 1, rng);

    const all = [...three, outlier];
    const shuffled = seededShuffle(all, rng);
    const oddIndex = shuffled.findIndex((c) => c.iso3 === outlier.iso3);

    return {
      countries: shuffled,
      oddIndex,
      trait: "land borders",
      traitDescription: "The other three have land borders with other countries",
    };
  }

  return null;
}

const traitGenerators: TraitGenerator[] = [
  byContinentRound,
  byRegionRound,
  byFirstLetterRound,
  byLandlockedRound,
];

export function createOddOneOut(rng: () => number, roundCount = 5): OddOneOutState {
  const rounds: OddOneOutRound[] = [];

  for (let i = 0; i < roundCount; i++) {
    const genIdx = Math.floor(rng() * traitGenerators.length);
    const gen = traitGenerators[genIdx];
    const round = gen(rng);

    if (round) {
      rounds.push(round);
    } else {
      // Fallback to continent-based round
      const fallback = byContinentRound(rng);
      if (fallback) rounds.push(fallback);
    }
  }

  return {
    rounds,
    currentRound: 0,
    answers: new Array(rounds.length).fill(null),
    score: 0,
    phase: "playing",
  };
}

export function answerRound(state: OddOneOutState, chosenIndex: number): OddOneOutState {
  if (state.phase !== "playing") return state;

  const round = state.rounds[state.currentRound];
  const isCorrect = chosenIndex === round.oddIndex;

  const newAnswers = [...state.answers];
  newAnswers[state.currentRound] = chosenIndex;

  return {
    ...state,
    answers: newAnswers,
    score: state.score + (isCorrect ? 1 : 0),
    phase: "feedback",
  };
}

export function nextRound(state: OddOneOutState): OddOneOutState {
  if (state.phase !== "feedback") return state;

  const next = state.currentRound + 1;
  const isComplete = next >= state.rounds.length;

  return {
    ...state,
    currentRound: isComplete ? state.currentRound : next,
    phase: isComplete ? "results" : "playing",
  };
}
