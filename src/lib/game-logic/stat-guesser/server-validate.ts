/**
 * Server-side replay check for the Stat Guesser daily (concept 5.6).
 *
 * Rebuilds the day's board from the same seed the play route uses
 * (`dateSeed(dateKey + edition)`), then checks the submitted run against it:
 *   - the five countries and the five stats are the board's, in order;
 *   - every guess is a step of that round's ruler (the pin cannot rest anywhere else);
 *   - the per-round points are recomputed from guess and true value, round 5 counts double,
 *     and the total must equal both `resultJson.total` and `scoreRaw` exactly.
 *
 * `checkStatGuesserShape` is the cheap shape check `validateGameResult` runs for every mode.
 */
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import {
  MAX_SCORE,
  ROUNDS,
  ROUND_WEIGHTS,
  boardPlan,
  createStatGuesser,
  isGuessStat,
  pointsFor,
  rulerFor,
  stepIndexOf,
} from "./engine";

/** The payload's resultJson (version 2, October 2026 rules). */
export interface StatGuesserResultJson {
  v: 2;
  total: number;
  /** Points per round before doubling, 0 to 100. */
  points: number[];
  /** The locked ruler value per round. */
  guesses: number[];
  /** The stat slug per round. */
  stats: string[];
  targetIso3s: string[];
}

function intArray(value: unknown, length: number, lo: number, hi: number): number[] | null {
  if (!Array.isArray(value) || value.length !== length) return null;
  const out: number[] = [];
  for (const x of value) {
    if (typeof x !== "number" || !Number.isInteger(x) || x < lo || x > hi) return null;
    out.push(x);
  }
  return out;
}

/**
 * The shape and arithmetic check for any Stat Guesser submission (daily and practice):
 * five integer round points in 0..100, round 5 doubled, summed into `total` = scoreRaw.
 * Returns an error code for `validateGameResult`, or null when the run adds up.
 */
export function checkStatGuesserShape(scoreRaw: number, scoreMax: number, resultJson: Record<string, unknown>): string | null {
  if (resultJson.v !== 2) return "invalid_result";
  if (scoreMax !== MAX_SCORE) return "invalid_result";
  const points = intArray(resultJson.points, ROUNDS, 0, 100);
  if (!points) return "invalid_result";
  const total = points.reduce((sum, p, i) => sum + p * ROUND_WEIGHTS[i], 0);
  if (resultJson.total !== total || scoreRaw !== total) return "score_mismatch";
  if (scoreRaw < 0 || scoreRaw > MAX_SCORE) return "score_exceeds_total";
  return null;
}

export function validateStatGuesserResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  const shape = checkStatGuesserShape(scoreRaw, MAX_SCORE, resultJson);
  if (shape) return { valid: false, reason: shape };

  const seed = dateSeed(dateKey + edition);
  const state = createStatGuesser(mulberry32(seed), boardPlan(seed, "daily", dateKey));

  const { targetIso3s, stats, guesses, points } = resultJson;
  if (!Array.isArray(targetIso3s) || targetIso3s.length !== ROUNDS) return { valid: false, reason: "targetIso3s must list five countries" };
  if (!Array.isArray(stats) || stats.length !== ROUNDS) return { valid: false, reason: "stats must list five stats" };
  if (!Array.isArray(guesses) || guesses.length !== ROUNDS) return { valid: false, reason: "guesses must list five values" };
  if (!Array.isArray(points)) return { valid: false, reason: "points missing" };

  for (let i = 0; i < ROUNDS; i++) {
    const round = state.rounds[i];
    if (targetIso3s[i] !== round.country.iso3) {
      return { valid: false, reason: `targetIso3s[${i}] mismatch: expected ${round.country.iso3}` };
    }
    const stat: unknown = stats[i];
    if (typeof stat !== "string" || !isGuessStat(stat) || stat !== round.stat) {
      return { valid: false, reason: `stats[${i}] mismatch: expected ${round.stat}` };
    }
    const guess: unknown = guesses[i];
    if (typeof guess !== "number" || !Number.isFinite(guess)) return { valid: false, reason: `guesses[${i}] must be a finite number` };
    if (stepIndexOf(rulerFor(round.stat), guess) < 0) return { valid: false, reason: `guesses[${i}] is not a ruler step` };
    const expected = pointsFor(round.stat, guess, round.actualValue);
    if (points[i] !== expected) return { valid: false, reason: `points[${i}] mismatch: expected ${expected}` };
  }

  return { valid: true };
}
