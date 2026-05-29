/**
 * Server-side anti-cheat validator for the Budget daily game.
 *
 * Replays the daily config from getDailyRng(dateKey, edition), recomputes the
 * true shares + even-split baseline, then verifies the submitted allocation sums
 * to 100 and that its baseline-relative accuracy matches scoreRaw.
 */
import { getDailyRng } from "@/lib/daily-seed";
import { generateBudgetConfig } from "./generator";

export function validateBudgetResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  let config;
  try {
    config = generateBudgetConfig(getDailyRng(dateKey, edition), "daily", dateKey);
  } catch {
    return { valid: true };
  }

  if (!Number.isFinite(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  if (resultJson.allocation !== undefined) {
    const alloc = resultJson.allocation;
    if (!Array.isArray(alloc) || alloc.length !== config.countries.length) {
      return { valid: false, reason: `allocation must be ${config.countries.length} numbers` };
    }
    let sum = 0;
    for (const a of alloc) {
      if (!Number.isFinite(a) || a < 0) {
        return { valid: false, reason: `allocation entry invalid: ${String(a)}` };
      }
      sum += a as number;
    }
    if (Math.round(sum) !== config.tokens) {
      return { valid: false, reason: `allocation sums to ${sum}, expected ${config.tokens}` };
    }

    const trueShares = config.countries.map((c) => c.trueShare);
    const totalError = (alloc as number[]).reduce(
      (s, a, i) => s + Math.abs(a - trueShares[i]),
      0,
    );
    const expected =
      config.baseError > 0
        ? Math.round(100 * Math.max(0, 1 - totalError / config.baseError))
        : totalError === 0
          ? 100
          : 0;
    if (Math.abs(expected - scoreRaw) > 1) {
      return { valid: false, reason: `accuracy mismatch: expected ~${expected}, got ${scoreRaw}` };
    }
  }

  return { valid: true };
}
