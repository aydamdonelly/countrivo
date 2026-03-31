import { getAllCountries } from "@/lib/data/countries";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

const TOTAL_ROUNDS = 10;

/* ── Types ─────────────────────────────────────────────────────────── */

export interface BlitzRound {
  country: Country;
  answered: boolean;
  correct: boolean;
  timeMs: number | null; // time to answer in ms
}

export interface BlitzState {
  phase: "playing" | "between" | "results";
  rounds: BlitzRound[];
  currentRound: number;
  myScore: number;
  opponentScore: number;
  totalRounds: number;
  roundStartTime: number; // Date.now() when round started
}

/* ── Abbreviation map ────────────────────────────────────────────── */

const ABBREVIATIONS: Record<string, string> = {
  usa: "United States",
  "united states of america": "United States",
  us: "United States",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  "dr congo": "Congo (Democratic Republic)",
  drc: "Congo (Democratic Republic)",
  "democratic republic of congo": "Congo (Democratic Republic)",
  "democratic republic of the congo": "Congo (Democratic Republic)",
  "republic of congo": "Congo (Republic)",
  "congo republic": "Congo (Republic)",
  "congo brazzaville": "Congo (Republic)",
  "congo kinshasa": "Congo (Democratic Republic)",
  "south korea": "Korea (South)",
  "north korea": "Korea (North)",
  "ivory coast": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "czech republic": "Czechia",
  bosnia: "Bosnia and Herzegovina",
  "east timor": "Timor-Leste",
  "cape verde": "Cabo Verde",
  swaziland: "Eswatini",
  burma: "Myanmar",
};

/* ── Helpers ──────────────────────────────────────────────────────── */

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

/* ── Create game ─────────────────────────────────────────────────── */

export function createBlitz(rng: () => number): BlitzState {
  const allCountries = getAllCountries();

  /* Pick 10 random countries with distinct flags */
  const picked = seededPick(allCountries, TOTAL_ROUNDS, rng);

  const rounds: BlitzRound[] = picked.map((country) => ({
    country,
    answered: false,
    correct: false,
    timeMs: null,
  }));

  return {
    phase: "playing",
    rounds,
    currentRound: 0,
    myScore: 0,
    opponentScore: 0,
    totalRounds: TOTAL_ROUNDS,
    roundStartTime: Date.now(),
  };
}

/* ── Check answer ────────────────────────────────────────────────── */

export function checkAnswer(input: string, country: Country): boolean {
  const needle = normalise(input);

  if (!needle) return false;

  /* 1. Check abbreviations first */
  const abbrTarget = ABBREVIATIONS[needle];
  if (abbrTarget) {
    if (
      normalise(country.name) === normalise(abbrTarget) ||
      normalise(country.displayName) === normalise(abbrTarget)
    ) {
      return true;
    }
  }

  /* 2. Exact match on name or displayName */
  if (
    normalise(country.name) === needle ||
    normalise(country.displayName) === needle
  ) {
    return true;
  }

  /* 3. ISO2 / ISO3 match */
  if (
    normalise(country.iso2) === needle ||
    normalise(country.iso3) === needle
  ) {
    return true;
  }

  /* 4. Prefix match (e.g. "switz" -> "Switzerland") */
  if (
    normalise(country.name).startsWith(needle) ||
    normalise(country.displayName).startsWith(needle)
  ) {
    return true;
  }

  return false;
}

/* ── Submit answer ───────────────────────────────────────────────── */

export function submitAnswer(
  state: BlitzState,
  input: string,
): BlitzState {
  if (state.phase !== "playing") return state;

  const round = state.rounds[state.currentRound];
  if (!round || round.answered) return state;

  const isCorrect = checkAnswer(input, round.country);
  const timeMs = Date.now() - state.roundStartTime;

  const updatedRound: BlitzRound = {
    ...round,
    answered: true,
    correct: isCorrect,
    timeMs,
  };

  const newRounds = [
    ...state.rounds.slice(0, state.currentRound),
    updatedRound,
    ...state.rounds.slice(state.currentRound + 1),
  ];

  return {
    ...state,
    phase: "between",
    rounds: newRounds,
    myScore: state.myScore + (isCorrect ? 1 : 0),
  };
}

/* ── Next round ──────────────────────────────────────────────────── */

export function nextRound(state: BlitzState): BlitzState {
  if (state.phase !== "between") return state;

  const next = state.currentRound + 1;

  if (next >= state.totalRounds) {
    return { ...state, phase: "results" };
  }

  return {
    ...state,
    phase: "playing",
    currentRound: next,
    roundStartTime: Date.now(),
  };
}

/* ── Opponent scored (versus mode) ───────────────────────────────── */

export function opponentScored(state: BlitzState): BlitzState {
  if (state.phase !== "playing") return state;

  const round = state.rounds[state.currentRound];
  if (!round || round.answered) return state;

  const updatedRound: BlitzRound = {
    ...round,
    answered: true,
    correct: false, // opponent won this round, not us
    timeMs: null,
  };

  const newRounds = [
    ...state.rounds.slice(0, state.currentRound),
    updatedRound,
    ...state.rounds.slice(state.currentRound + 1),
  ];

  return {
    ...state,
    phase: "between",
    rounds: newRounds,
    opponentScore: state.opponentScore + 1,
  };
}
