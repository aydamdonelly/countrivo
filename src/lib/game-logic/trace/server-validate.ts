/**
 * Server-side anti-cheat validator for the Trace daily game.
 *
 * Re-creates the daily puzzle from the same seed convention the client uses
 * (`getDailyRng(dateKey)` — plain dateKey, no slug suffix) and compares the
 * submitted result against what the engine actually produced.
 *
 * Returns `{ valid: true }` when the submission is consistent with the daily
 * puzzle. Returns `{ valid: false, reason }` only when the submission is
 * clearly impossible. Be conservative: false negatives lock honest users out.
 */
import { getDailyRng } from "@/lib/daily-seed";
import { createCountryle } from "./engine";

export function validateTraceResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>
): { valid: boolean; reason?: string } {
  // 1. Re-create the daily puzzle deterministically.
  let state;
  try {
    const rng = getDailyRng(dateKey);
    state = createCountryle(rng, dateKey);
  } catch {
    // If we can't recreate the puzzle we cannot validate — accept rather than
    // block honest users on internal data issues.
    return { valid: true };
  }

  const expectedTarget = state.target.iso3;

  // 2. Verify submitted target matches the engine's target.
  const submittedTarget = resultJson.target;
  if (typeof submittedTarget !== "string") {
    return { valid: false, reason: "missing or invalid target field" };
  }
  if (submittedTarget !== expectedTarget) {
    return {
      valid: false,
      reason: `target mismatch: expected ${expectedTarget}, got ${submittedTarget}`,
    };
  }

  // 3. Verify scoreRaw ∈ [1..7]. 1..6 = won in N guesses, 7 = lost.
  if (!Number.isInteger(scoreRaw) || scoreRaw < 1 || scoreRaw > 7) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  // 4. Verify won flag is consistent with scoreRaw.
  const won = resultJson.won;
  if (typeof won !== "boolean") {
    return { valid: false, reason: "missing or invalid won field" };
  }
  const expectedWon = scoreRaw < 7;
  if (won !== expectedWon) {
    return {
      valid: false,
      reason: `won/scoreRaw mismatch: scoreRaw=${scoreRaw}, won=${won}`,
    };
  }

  // 5. Sanity-check guesses array shape if present.
  if (resultJson.guesses !== undefined) {
    if (!Array.isArray(resultJson.guesses)) {
      return { valid: false, reason: "guesses must be an array" };
    }
    if (resultJson.guesses.length > 6) {
      return {
        valid: false,
        reason: `too many guesses: ${resultJson.guesses.length}`,
      };
    }
    // If won, the final guess must be the target.
    if (won && resultJson.guesses.length > 0) {
      const last = resultJson.guesses[resultJson.guesses.length - 1];
      if (typeof last === "string" && last !== expectedTarget) {
        return {
          valid: false,
          reason: "won=true but final guess is not the target",
        };
      }
    }
    // If won, guesses.length should equal scoreRaw.
    if (won && resultJson.guesses.length !== scoreRaw) {
      return {
        valid: false,
        reason: `won=true but guesses.length=${resultJson.guesses.length} != scoreRaw=${scoreRaw}`,
      };
    }
  }

  return { valid: true };
}
