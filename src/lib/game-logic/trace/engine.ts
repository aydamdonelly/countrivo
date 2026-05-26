import { countries } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import {
  COUNTRYLE_CATEGORIES,
  type CountryleCategoryResult,
  type CountryleGuessRow,
  type CountryleState,
} from "./types";

const stats: Record<string, Record<string, number | null>> = statsData;

// Hardcoded first daily targets
const DAILY_OVERRIDES: Record<string, string> = {
  "2026-04-09": "ITA",
  "2026-04-10": "IRL",
};

/** Countries that have non-null values for all 6 comparison categories */
export function getEligibleCountries(): Country[] {
  return countries.filter((c) => {
    const s = stats[c.iso3];
    if (!s) return false;
    return COUNTRYLE_CATEGORIES.every((cat) => s[cat] != null);
  });
}

function pickTarget(rng: () => number, dateKey?: string): Country {
  if (dateKey && DAILY_OVERRIDES[dateKey]) {
    const iso3 = DAILY_OVERRIDES[dateKey];
    const country = countries.find((c) => c.iso3 === iso3);
    if (country) return country;
  }

  const eligible = getEligibleCountries();
  const shuffled = seededShuffle(eligible, rng);
  return shuffled[0];
}

export function createCountryle(rng: () => number, dateKey?: string): CountryleState {
  const target = pickTarget(rng, dateKey);
  const targetStats: Record<string, number> = {};
  const s = stats[target.iso3];
  for (const cat of COUNTRYLE_CATEGORIES) {
    targetStats[cat] = s?.[cat] as number;
  }

  return {
    target,
    targetStats,
    guesses: [],
    phase: "playing",
    maxGuesses: 6,
  };
}

function compareValue(guessed: number | null, target: number): CountryleCategoryResult["direction"] {
  if (guessed == null) return "unknown";
  if (guessed === target) return "match";
  return target > guessed ? "higher" : "lower";
}

export function submitGuess(state: CountryleState, country: Country): CountryleState {
  if (state.phase !== "playing") return state;
  if (state.guesses.length >= state.maxGuesses) return state;
  if (state.guesses.some((g) => g.country.iso3 === country.iso3)) return state;

  const guessedStats = stats[country.iso3];

  const comparisons: CountryleCategoryResult[] = COUNTRYLE_CATEGORIES.map((cat) => ({
    category: cat,
    guessedValue: guessedStats?.[cat] as number | null ?? null,
    direction: compareValue(
      guessedStats?.[cat] as number | null ?? null,
      state.targetStats[cat]
    ),
  }));

  const isCorrect = country.iso3 === state.target.iso3;
  const continentMatch = country.continent === state.target.continent;

  const row: CountryleGuessRow = {
    country,
    comparisons,
    continentMatch,
    isCorrect,
  };

  const guesses = [...state.guesses, row];
  let phase: CountryleState["phase"] = state.phase;
  if (isCorrect) {
    phase = "won";
  } else if (guesses.length >= state.maxGuesses) {
    phase = "lost";
  }

  return { ...state, guesses, phase };
}
