/**
 * Server-side anti-cheat validator for the Stat Guesser daily game.
 *
 * Re-creates the daily puzzle from the same seed convention the client uses
 * (`getDailyRng(dateKey)` — plain dateKey, no slug suffix) and verifies the
 * submitted target ISO3 matches the engine's. Score is recomputed from the
 * submitted guesses and compared against `scoreRaw` (= round(100 - avgError)).
 *
 * Daily Stat Guesser is a single round (DAILY_ROUNDS = 1).
 */
import { getDailyRng } from "@/lib/daily-seed";
import { createStatGuesser } from "./engine";

const DAILY_ROUNDS = 1;
const SCORE_TOLERANCE = 1; // allow off-by-one for float rounding

export function validateStatGuesserResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string
): { valid: boolean; reason?: string } {
  // 1. Recreate the daily puzzle deterministically.
  let state;
  try {
    const rng = getDailyRng(dateKey, edition);
    state = createStatGuesser(rng, DAILY_ROUNDS);
  } catch {
    return { valid: true };
  }

  const expectedTargetIso3 = state.rounds[0].country.iso3;

  // 2. Verify targetIso3 matches.
  const submittedTarget = resultJson.targetIso3;
  if (typeof submittedTarget !== "string") {
    return { valid: false, reason: "missing or invalid targetIso3 field" };
  }
  if (submittedTarget !== expectedTargetIso3) {
    return {
      valid: false,
      reason: `targetIso3 mismatch: expected ${expectedTargetIso3}, got ${submittedTarget}`,
    };
  }

  // 3. Bounds on scoreRaw — score is round(100 - avgError), clamped to [0, 100].
  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  // 4. Verify targetIso3s array shape if present.
  if (resultJson.targetIso3s !== undefined) {
    if (!Array.isArray(resultJson.targetIso3s)) {
      return { valid: false, reason: "targetIso3s must be an array" };
    }
    if (resultJson.targetIso3s.length !== DAILY_ROUNDS) {
      return {
        valid: false,
        reason: `targetIso3s length=${resultJson.targetIso3s.length} != ${DAILY_ROUNDS}`,
      };
    }
    if (resultJson.targetIso3s[0] !== expectedTargetIso3) {
      return {
        valid: false,
        reason: `targetIso3s[0] mismatch: expected ${expectedTargetIso3}`,
      };
    }
  }

  // 5. Recompute scoreRaw from submitted guesses and compare.
  if (resultJson.guesses !== undefined) {
    if (!Array.isArray(resultJson.guesses)) {
      return { valid: false, reason: "guesses must be an array" };
    }
    if (resultJson.guesses.length !== DAILY_ROUNDS) {
      return {
        valid: false,
        reason: `guesses length=${resultJson.guesses.length} != ${DAILY_ROUNDS}`,
      };
    }

    const guess = resultJson.guesses[0];
    if (typeof guess !== "number" || !Number.isFinite(guess)) {
      return { valid: false, reason: "guess must be a finite number" };
    }

    const actual = state.rounds[0].actualValue;
    const percentError =
      actual === 0
        ? guess === 0
          ? 0
          : 100
        : (Math.abs(guess - actual) / Math.abs(actual)) * 100;
    const rounded = Math.round(percentError * 10) / 10;
    const expectedScore = Math.round(Math.max(0, 100 - rounded));

    if (Math.abs(expectedScore - scoreRaw) > SCORE_TOLERANCE) {
      return {
        valid: false,
        reason: `score mismatch: expected ~${expectedScore}, got ${scoreRaw}`,
      };
    }
  }

  return { valid: true };
}
