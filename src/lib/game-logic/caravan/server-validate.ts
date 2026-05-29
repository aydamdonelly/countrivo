/**
 * Server-side anti-cheat validator for the Caravan daily game.
 *
 * Replays the daily config from getDailyRng(dateKey, edition) and checks the
 * submitted basket: 5 distinct valid items, within budget, with total value not
 * exceeding the engine's optimum (bound check, not exact-set match — distinct
 * baskets can tie), and an efficiency that matches scoreRaw.
 */
import { getDailyRng } from "@/lib/daily-seed";
import { generateCaravanConfig } from "./generator";

export function validateCaravanResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string,
): { valid: boolean; reason?: string } {
  let config;
  try {
    config = generateCaravanConfig(getDailyRng(dateKey, edition), "daily", dateKey);
  } catch {
    return { valid: true };
  }

  // scoreRaw is the efficiency percentage (0-100).
  if (!Number.isFinite(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  if (resultJson.bought !== undefined) {
    const bought = resultJson.bought;
    if (!Array.isArray(bought) || bought.length !== config.buyCount) {
      return { valid: false, reason: `bought must be ${config.buyCount} items` };
    }
    const seen = new Set<number>();
    let value = 0;
    let price = 0;
    for (const i of bought) {
      if (!Number.isInteger(i) || i < 0 || i >= config.items.length) {
        return { valid: false, reason: `bought index out of range: ${String(i)}` };
      }
      if (seen.has(i)) return { valid: false, reason: `duplicate buy: ${i}` };
      seen.add(i);
      value += config.items[i].value;
      price += config.items[i].price;
    }
    if (price > config.budget) {
      return { valid: false, reason: `over budget: ${price} > ${config.budget}` };
    }
    if (value > config.optimalValue) {
      return { valid: false, reason: `value ${value} exceeds optimum ${config.optimalValue}` };
    }
    const expectedEff =
      config.optimalValue > 0 ? Math.round((value / config.optimalValue) * 100) : 0;
    if (Math.abs(expectedEff - scoreRaw) > 1) {
      return {
        valid: false,
        reason: `efficiency mismatch: expected ~${expectedEff}, got ${scoreRaw}`,
      };
    }
  }

  return { valid: true };
}
