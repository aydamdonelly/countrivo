import bordersData from "@/data/borders.json";
import { getAllCountries, getCountryByIso3 } from "@/lib/data/countries";
import { seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

const borders: Record<string, string[]> = bordersData;

/* ── Types ─────────────────────────────────────────────────────────── */

export interface BorderlineState {
  phase: "playing" | "finished";
  startCountry: Country;
  targetCountry: Country;
  path: Country[]; // countries visited so far (starts with startCountry)
  currentCountry: Country;
  optimalLength: number; // BFS shortest path length (number of steps)
  moveCount: number;
  won: boolean;
}

export interface MoveResult {
  state: BorderlineState;
  error: string | null;
}

/* ── Abbreviation map ─────────────────────────────────────────────── */

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
  "bosnia": "Bosnia and Herzegovina",
  "east timor": "Timor-Leste",
  "cape verde": "Cabo Verde",
  "swaziland": "Eswatini",
  "burma": "Myanmar",
};

/* ── Fuzzy match helper ───────────────────────────────────────────── */

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

export function fuzzyMatchCountry(input: string): Country | null {
  const countries = getAllCountries();
  const needle = normalise(input);

  if (!needle) return null;

  /* 1. Check abbreviations first */
  const abbrTarget = ABBREVIATIONS[needle];
  if (abbrTarget) {
    const found = countries.find(
      (c) =>
        normalise(c.name) === normalise(abbrTarget) ||
        normalise(c.displayName) === normalise(abbrTarget),
    );
    if (found) return found;
  }

  /* 2. Exact match on name or displayName */
  const exact = countries.find(
    (c) => normalise(c.name) === needle || normalise(c.displayName) === needle,
  );
  if (exact) return exact;

  /* 3. Prefix match (e.g. "switz" -> "Switzerland") */
  const prefix = countries.find(
    (c) =>
      normalise(c.name).startsWith(needle) ||
      normalise(c.displayName).startsWith(needle),
  );
  if (prefix) return prefix;

  /* 4. Substring match */
  const substring = countries.find(
    (c) =>
      normalise(c.name).includes(needle) ||
      normalise(c.displayName).includes(needle),
  );
  if (substring) return substring;

  /* 5. ISO3 match */
  const iso3Match = countries.find(
    (c) => normalise(c.iso3) === needle,
  );
  if (iso3Match) return iso3Match;

  return null;
}

/* ── BFS shortest path ────────────────────────────────────────────── */

export function bfsShortestPath(
  startIso3: string,
  targetIso3: string,
): string[] | null {
  if (startIso3 === targetIso3) return [startIso3];

  const queue: string[][] = [[startIso3]];
  const visited = new Set<string>([startIso3]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const neighbors = borders[current] ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const newPath = [...path, neighbor];

      if (neighbor === targetIso3) return newPath;

      visited.add(neighbor);
      queue.push(newPath);
    }
  }

  return null;
}

/* ── Get valid neighbors ──────────────────────────────────────────── */

export function getValidNeighbors(iso3: string): Country[] {
  const neighborCodes = borders[iso3] ?? [];
  const result: Country[] = [];
  for (const code of neighborCodes) {
    const country = getCountryByIso3(code);
    if (country) result.push(country);
  }
  return result;
}

/* ── Create game ──────────────────────────────────────────────────── */

export function createBorderline(rng: () => number): BorderlineState {
  const allCountries = getAllCountries();

  /* Only consider countries that have borders */
  const withBorders = allCountries.filter(
    (c) => (borders[c.iso3] ?? []).length > 0,
  );

  /* Shuffle and try to find a valid start/target pair */
  const shuffled = seededShuffle(withBorders, rng);

  for (const start of shuffled) {
    /* BFS to find all reachable countries with their distance */
    const distances = new Map<string, number>();
    distances.set(start.iso3, 0);
    const queue = [start.iso3];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dist = distances.get(current)!;
      const neighbors = borders[current] ?? [];

      for (const neighbor of neighbors) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, dist + 1);
          queue.push(neighbor);
        }
      }
    }

    /* Collect candidates 3-6 steps away */
    const candidates: Country[] = [];
    for (const [iso3, dist] of distances) {
      if (dist >= 3 && dist <= 6) {
        const country = getCountryByIso3(iso3);
        if (country) candidates.push(country);
      }
    }

    if (candidates.length === 0) continue;

    /* Pick a target from candidates using rng */
    const targetIdx = Math.floor(rng() * candidates.length);
    const target = candidates[targetIdx];

    /* Compute optimal path */
    const optimalPath = bfsShortestPath(start.iso3, target.iso3);
    if (!optimalPath) continue;

    return {
      phase: "playing",
      startCountry: start,
      targetCountry: target,
      path: [start],
      currentCountry: start,
      optimalLength: optimalPath.length - 1, // number of steps, not nodes
      moveCount: 0,
      won: false,
    };
  }

  /* Fallback: should never happen with real data */
  throw new Error("Could not generate a valid Borderline game");
}

/* ── Make a move ──────────────────────────────────────────────────── */

export function makeMove(
  state: BorderlineState,
  countryName: string,
): MoveResult {
  if (state.phase !== "playing") {
    return { state, error: "Game is already finished" };
  }

  /* Fuzzy match the input */
  const matched = fuzzyMatchCountry(countryName);
  if (!matched) {
    return { state, error: "Country not found" };
  }

  /* Check if the matched country borders the current country */
  const neighborCodes = borders[state.currentCountry.iso3] ?? [];
  if (!neighborCodes.includes(matched.iso3)) {
    return {
      state,
      error: `${matched.displayName} does not border ${state.currentCountry.displayName}`,
    };
  }

  /* Check if already visited */
  if (state.path.some((c) => c.iso3 === matched.iso3)) {
    return { state, error: `You already visited ${matched.displayName}` };
  }

  const newPath = [...state.path, matched];
  const newMoveCount = state.moveCount + 1;
  const reachedTarget = matched.iso3 === state.targetCountry.iso3;

  return {
    state: {
      ...state,
      phase: reachedTarget ? "finished" : "playing",
      path: newPath,
      currentCountry: matched,
      moveCount: newMoveCount,
      won: reachedTarget,
    },
    error: null,
  };
}
