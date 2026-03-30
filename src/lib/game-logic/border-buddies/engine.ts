import { countries } from "@/lib/data/loader";
import bordersData from "@/data/borders.json";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

const borders: Record<string, string[]> = bordersData;

export interface BorderBuddiesState {
  country: Country;
  borders: string[]; // iso3 codes of bordering countries
  found: string[];   // iso3 codes found by player
  phase: "playing" | "results";
}

export function createBorderBuddies(rng: () => number): BorderBuddiesState {
  // Pick a country that has at least 2 borders
  const eligible = countries.filter(
    (c) => borders[c.iso3] && borders[c.iso3].length >= 2
  );
  const [country] = seededPick(eligible, 1, rng);

  return {
    country,
    borders: borders[country.iso3],
    found: [],
    phase: "playing",
  };
}

export function guessCountry(state: BorderBuddiesState, iso3: string): BorderBuddiesState {
  if (state.phase !== "playing") return state;
  if (state.found.includes(iso3)) return state;
  if (!state.borders.includes(iso3)) return state;

  const newFound = [...state.found, iso3];
  const allFound = newFound.length === state.borders.length;

  return {
    ...state,
    found: newFound,
    phase: allFound ? "results" : "playing",
  };
}

export function giveUp(state: BorderBuddiesState): BorderBuddiesState {
  return { ...state, phase: "results" };
}
