import { countries, centroids } from "@/lib/data/loader";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

export const MAX_GUESSES = 6;

/**
 * Proximity bands, cut by great-circle distance rather than by percentage.
 * The board colours the band, not the raw number, so the cuts have to land on
 * distances a player can actually reason about: a neighbour, a region, a
 * continent, the other side of the world.
 */
export type GeoBand = "hit" | "burning" | "hot" | "warm" | "cool" | "cold";

/** One submitted guess, fully resolved against the secret answer. */
export interface GeoGuess {
  iso3: string;
  name: string;
  iso2: string;
  distanceKm: number; // great-circle km from guess to answer (0 if correct)
  bearingDeg: number; // 0..360 compass bearing FROM guess TO answer (0 if correct)
  arrow: string; // 8-way direction emoji; 🎯 when correct — share text + a11y fallback
  direction: string; // spelled-out bearing ("north-east"); "" when correct
  proximityPct: number; // 0..100, 100 when correct
  band: GeoBand;
  correct: boolean;
}

export interface GeoWordleState {
  answerIso3: string; // the secret country — never rendered until finished
  guesses: GeoGuess[];
  phase: "playing" | "won" | "lost";
}

// N, NE, E, SE, S, SW, W, NW (index = round(bearing / 45) % 8)
const ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
const DIRECTIONS = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];
const MAX_DIST_KM = 20015; // ~half earth circumference, normalises proximity

/**
 * Upper distance bound per band, in km. Ordered nearest-first; the first entry
 * a distance fits under wins.
 */
const BANDS: ReadonlyArray<{ band: GeoBand; maxKm: number }> = [
  { band: "burning", maxKm: 1_000 },
  { band: "hot", maxKm: 2_500 },
  { band: "warm", maxKm: 5_000 },
  { band: "cool", maxKm: 9_000 },
  { band: "cold", maxKm: Infinity },
];

const byIso3 = new Map(countries.map((c) => [c.iso3, c]));

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}
function toDeg(r: number): number {
  return (r * 180) / Math.PI;
}

/** Great-circle distance in km (haversine), R = 6371. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial compass bearing FROM a TO b, normalised to 0..360. */
function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const phi1 = toRad(aLat);
  const phi2 = toRad(bLat);
  const dLambda = toRad(bLng - aLng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function compassIndex(bearing: number): number {
  return Math.round(bearing / 45) % 8;
}

function arrowFor(bearing: number): string {
  return ARROWS[compassIndex(bearing)];
}

function directionFor(bearing: number): string {
  return DIRECTIONS[compassIndex(bearing)];
}

/**
 * 0..100 "how warm are you" score.
 *
 * The old scale was linear over half the earth's circumference, which put a
 * guess 5,000 km off — a whole continent away — at 75% of a full bar. Nearly
 * every guess looked close and the bar barely moved, so it carried no signal.
 * Square-rooting the normalised distance spends most of the bar on the range
 * that actually decides the puzzle: 500 km reads 84%, 2,500 km reads 65%,
 * 9,000 km reads 33%.
 */
function proximityFor(distanceKm: number): number {
  const norm = Math.max(0, Math.min(1, distanceKm / MAX_DIST_KM));
  return Math.round(100 * (1 - Math.sqrt(norm)));
}

function bandFor(distanceKm: number, correct: boolean): GeoBand {
  if (correct) return "hit";
  return BANDS.find(({ maxKm }) => distanceKm < maxKm)?.band ?? "cold";
}

/** Countries usable as the secret AND as guesses (must have a centroid). */
export function guessableCountries(): Country[] {
  return countries.filter((c) => centroids[c.iso3] != null);
}

/** A country's centroid as `{ lat, lng }`, or null when it has none. */
export function centroidFor(iso3: string): { lat: number; lng: number } | null {
  const c = centroids[iso3];
  return c ? { lat: c[0], lng: c[1] } : null;
}

/**
 * Every centroid on the board, used as the faint backdrop of the mini map:
 * plotted at low opacity the 237 points read as the continents themselves, so
 * the map needs no polygon data. Never includes which one is the answer.
 */
export function allCentroids(): ReadonlyArray<{ iso3: string; lat: number; lng: number }> {
  return Object.entries(centroids).map(([iso3, [lat, lng]]) => ({ iso3, lat, lng }));
}

/** Resolve the secret country object for a state. */
export function answerCountry(state: GeoWordleState): Country | undefined {
  return byIso3.get(state.answerIso3);
}

/**
 * Seeded, deterministic: consumes EXACTLY one seededPick draw so the same
 * getDailyRng(dateKey, edition) yields the same answer worldwide. No Math.random.
 */
export function createGeoWordle(rng: () => number): GeoWordleState {
  const pool = guessableCountries();
  const [answer] = seededPick(pool, 1, rng);
  return { answerIso3: answer.iso3, guesses: [], phase: "playing" };
}

/** Case-insensitive exact match on name OR displayName, restricted to guessables. */
export function resolveGuess(input: string): Country | null {
  const needle = input.trim().toLowerCase();
  if (!needle) return null;
  return (
    guessableCountries().find(
      (c) => c.name.toLowerCase() === needle || c.displayName.toLowerCase() === needle,
    ) ?? null
  );
}

export function submitGuess(state: GeoWordleState, country: Country): GeoWordleState {
  if (state.phase !== "playing") return state;
  if (state.guesses.some((g) => g.iso3 === country.iso3)) return state; // ignore dup
  const answer = byIso3.get(state.answerIso3);
  const gC = centroids[country.iso3];
  const aC = answer ? centroids[answer.iso3] : undefined;
  if (!answer || !gC || !aC) return state; // defensive; both have centroids post-filter

  const correct = country.iso3 === answer.iso3;
  const distanceKm = correct ? 0 : Math.round(haversineKm(gC[0], gC[1], aC[0], aC[1]));
  const bearing = correct ? 0 : bearingDeg(gC[0], gC[1], aC[0], aC[1]);
  const proximityPct = correct ? 100 : proximityFor(distanceKm);

  const guess: GeoGuess = {
    iso3: country.iso3,
    name: country.displayName,
    iso2: country.iso2,
    distanceKm,
    bearingDeg: bearing,
    arrow: correct ? "🎯" : arrowFor(bearing),
    direction: correct ? "" : directionFor(bearing),
    proximityPct,
    band: bandFor(distanceKm, correct),
    correct,
  };
  const guesses = [...state.guesses, guess];
  const phase: GeoWordleState["phase"] = correct
    ? "won"
    : guesses.length >= MAX_GUESSES
      ? "lost"
      : "playing";
  return { ...state, guesses, phase };
}

/** Guesses used: a win uses guesses.length (1..6); a loss is recorded as 6. */
export function guessesUsed(state: GeoWordleState): number {
  return state.phase === "won" ? state.guesses.length : MAX_GUESSES;
}
