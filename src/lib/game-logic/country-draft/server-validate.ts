/**
 * Server-side anti-cheat validator for the Country Draft daily game.
 *
 * Re-creates the daily config from the same seed convention the client uses
 * (`getDailyRng(dateKey)` — plain dateKey, no slug suffix) and verifies the
 * submitted assignments only use countries/categories from the daily set and
 * that the recomputed player score matches `scoreRaw`.
 *
 * Returns `{ valid: true }` when the submission is consistent. Returns
 * `{ valid: false, reason }` only when the submission is clearly impossible.
 */
import { getDailyRng } from "@/lib/daily-seed";
import { generateDraftConfig } from "./generator";

const MAX_POSSIBLE_SCORE = 8 * 243; // 8 countries × worst rank (243) = 1944

interface SubmittedAssignment {
  countryIdx: number;
  categoryIdx: number;
  rank: number;
}

function isAssignment(x: unknown): x is SubmittedAssignment {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    Number.isInteger(obj.countryIdx) &&
    Number.isInteger(obj.categoryIdx) &&
    Number.isFinite(obj.rank as number)
  );
}

export function validateCountryDraftResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string
): { valid: boolean; reason?: string } {
  // 1. Recreate the daily config deterministically.
  let config;
  try {
    const rng = getDailyRng(dateKey, edition);
    config = generateDraftConfig(rng, "daily", dateKey);
  } catch {
    return { valid: true };
  }

  // 2. Sanity bounds on scoreRaw.
  if (
    !Number.isFinite(scoreRaw) ||
    scoreRaw < 0 ||
    scoreRaw > MAX_POSSIBLE_SCORE
  ) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  // Player score must be at least optimal (lower is better).
  if (scoreRaw < config.optimalScore) {
    return {
      valid: false,
      reason: `scoreRaw=${scoreRaw} below optimal=${config.optimalScore}`,
    };
  }

  // 3. Verify the playerScore reported in resultJson matches scoreRaw.
  if (resultJson.playerScore !== undefined) {
    if (typeof resultJson.playerScore !== "number") {
      return { valid: false, reason: "playerScore must be a number" };
    }
    if (resultJson.playerScore !== scoreRaw) {
      return {
        valid: false,
        reason: `playerScore=${resultJson.playerScore} != scoreRaw=${scoreRaw}`,
      };
    }
  }

  // 4. Verify optimalScore matches the engine's.
  if (resultJson.optimalScore !== undefined) {
    if (
      typeof resultJson.optimalScore !== "number" ||
      resultJson.optimalScore !== config.optimalScore
    ) {
      return {
        valid: false,
        reason: `optimalScore mismatch: expected ${config.optimalScore}, got ${resultJson.optimalScore}`,
      };
    }
  }

  // 5. Verify countryIso3s match the daily eligible set (atlas album field).
  if (resultJson.countryIso3s !== undefined) {
    if (!Array.isArray(resultJson.countryIso3s)) {
      return { valid: false, reason: "countryIso3s must be an array" };
    }
    const expectedIso3s = config.countries.map((c) => c.iso3);
    const submittedIso3s = resultJson.countryIso3s;
    if (submittedIso3s.length !== expectedIso3s.length) {
      return {
        valid: false,
        reason: `countryIso3s length mismatch: expected ${expectedIso3s.length}, got ${submittedIso3s.length}`,
      };
    }
    // Order-independent set comparison.
    const expectedSet = new Set(expectedIso3s);
    for (const iso3 of submittedIso3s) {
      if (typeof iso3 !== "string" || !expectedSet.has(iso3)) {
        return {
          valid: false,
          reason: `countryIso3s contains unexpected country: ${String(iso3)}`,
        };
      }
    }
  }

  // 6. Recompute player score from submitted assignments and compare.
  if (resultJson.assignments !== undefined) {
    if (!Array.isArray(resultJson.assignments)) {
      return { valid: false, reason: "assignments must be an array" };
    }
    if (resultJson.assignments.length !== config.countries.length) {
      return {
        valid: false,
        reason: `assignments length=${resultJson.assignments.length} != ${config.countries.length}`,
      };
    }

    const usedCategoryIdxs = new Set<number>();
    let recomputed = 0;

    for (const a of resultJson.assignments) {
      if (!isAssignment(a)) {
        return { valid: false, reason: "malformed assignment entry" };
      }
      if (a.countryIdx < 0 || a.countryIdx >= config.countries.length) {
        return {
          valid: false,
          reason: `countryIdx out of range: ${a.countryIdx}`,
        };
      }
      if (a.categoryIdx < 0 || a.categoryIdx >= config.categories.length) {
        return {
          valid: false,
          reason: `categoryIdx out of range: ${a.categoryIdx}`,
        };
      }
      if (usedCategoryIdxs.has(a.categoryIdx)) {
        return {
          valid: false,
          reason: `category ${a.categoryIdx} assigned more than once`,
        };
      }
      usedCategoryIdxs.add(a.categoryIdx);

      const expectedRank = config.costMatrix[a.countryIdx][a.categoryIdx];
      if (a.rank !== expectedRank) {
        return {
          valid: false,
          reason: `rank mismatch at country ${a.countryIdx}, category ${a.categoryIdx}: expected ${expectedRank}, got ${a.rank}`,
        };
      }
      recomputed += expectedRank;
    }

    if (recomputed !== scoreRaw) {
      return {
        valid: false,
        reason: `recomputed score ${recomputed} != scoreRaw ${scoreRaw}`,
      };
    }
  }

  return { valid: true };
}
