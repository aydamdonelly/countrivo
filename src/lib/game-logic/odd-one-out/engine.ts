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

function bySubregionRound(rng: () => number): OddOneOutRound | null {
  const subregions = [...new Set(countries.map((c) => c.subregion))].filter(Boolean);
  const shuffled = seededShuffle(subregions, rng);

  for (const subregion of shuffled) {
    const inGroup = countries.filter((c) => c.subregion === subregion);
    const outGroup = countries.filter((c) => c.subregion !== subregion);

    if (inGroup.length >= 3 && outGroup.length >= 1) {
      const three = seededPick(inGroup, 3, rng);
      const [outlier] = seededPick(outGroup, 1, rng);

      const all = [...three, outlier];
      const result = seededShuffle(all, rng);
      const oddIndex = result.findIndex((c) => c.iso3 === outlier.iso3);

      return {
        countries: result,
        oddIndex,
        trait: "subregion",
        traitDescription: `The other three are in ${subregion}`,
      };
    }
  }

  return null;
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

function byBorderCountRound(rng: () => number): OddOneOutRound | null {
  // 3 countries with many borders (5+) vs 1 with few (0-1), or vice versa
  const manyBorders = countries.filter((c) => c.borders.length >= 5);
  const fewBorders = countries.filter((c) => c.borders.length <= 1);

  if (rng() < 0.5 && manyBorders.length >= 3 && fewBorders.length >= 1) {
    const three = seededPick(manyBorders, 3, rng);
    const [outlier] = seededPick(fewBorders, 1, rng);
    const all = seededShuffle([...three, outlier], rng);
    const oddIndex = all.findIndex((c) => c.iso3 === outlier.iso3);
    return {
      countries: all,
      oddIndex,
      trait: "many neighbors",
      traitDescription: "The other three each border 5+ countries",
    };
  }

  if (fewBorders.length >= 3 && manyBorders.length >= 1) {
    const three = seededPick(fewBorders, 3, rng);
    const [outlier] = seededPick(manyBorders, 1, rng);
    const all = seededShuffle([...three, outlier], rng);
    const oddIndex = all.findIndex((c) => c.iso3 === outlier.iso3);
    return {
      countries: all,
      oddIndex,
      trait: "few neighbors",
      traitDescription: "The other three have 0-1 land borders",
    };
  }

  return null;
}

function byCapitalLetterRound(rng: () => number): OddOneOutRound | null {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const shuffledLetters = seededShuffle(letters, rng);

  for (const letter of shuffledLetters) {
    const inGroup = countries.filter((c) => c.capital && c.capital.startsWith(letter));
    const outGroup = countries.filter((c) => c.capital && !c.capital.startsWith(letter));

    if (inGroup.length >= 3 && outGroup.length >= 1) {
      const three = seededPick(inGroup, 3, rng);
      const [outlier] = seededPick(outGroup, 1, rng);
      const all = seededShuffle([...three, outlier], rng);
      const oddIndex = all.findIndex((c) => c.iso3 === outlier.iso3);
      return {
        countries: all,
        oddIndex,
        trait: "capital letter",
        traitDescription: `The other three have capitals starting with "${letter}"`,
      };
    }
  }

  return null;
}

const traitGenerators: TraitGenerator[] = [
  byContinentRound,
  bySubregionRound,
  byFirstLetterRound,
  byLandlockedRound,
  byBorderCountRound,
  byCapitalLetterRound,
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
