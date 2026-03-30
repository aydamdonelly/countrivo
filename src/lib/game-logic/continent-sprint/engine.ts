import { countries } from "@/lib/data/loader";
import type { Country } from "@/types/country";

export const CONTINENTS = [
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Oceania",
  "Antarctica",
] as const;

export type Continent = (typeof CONTINENTS)[number];

export interface SprintState {
  continent: Continent | null;
  allCountries: Country[];
  found: string[]; // iso3 codes
  startTime: number;
  elapsed: number;
  phase: "picking" | "playing" | "results";
}

export function createSprint(): SprintState {
  return {
    continent: null,
    allCountries: [],
    found: [],
    startTime: 0,
    elapsed: 0,
    phase: "picking",
  };
}

export function pickContinent(state: SprintState, continent: Continent): SprintState {
  const matching = countries.filter((c) => c.continent === continent);

  return {
    ...state,
    continent,
    allCountries: matching,
    found: [],
    startTime: Date.now(),
    elapsed: 0,
    phase: "playing",
  };
}

export function guessCountry(state: SprintState, iso3: string): SprintState {
  if (state.phase !== "playing") return state;
  if (state.found.includes(iso3)) return state;

  const isValid = state.allCountries.some((c) => c.iso3 === iso3);
  if (!isValid) return state;

  const newFound = [...state.found, iso3];
  const allFound = newFound.length === state.allCountries.length;

  return {
    ...state,
    found: newFound,
    elapsed: Date.now() - state.startTime,
    phase: allFound ? "results" : "playing",
  };
}

export function finishSprint(state: SprintState): SprintState {
  return {
    ...state,
    elapsed: Date.now() - state.startTime,
    phase: "results",
  };
}
