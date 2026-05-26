/**
 * Stat-Guesser share-grid generator.
 *
 * Format:
 *   Countrivo · Stat-Guesser · DD · MM · YY
 *   🎯 Off by 12%
 *   Anchor: Spain → Tanzania
 *   countrivo.com
 *
 * For multi-round practice runs we show the average error and the first
 * anchor/target — the daily uses a single round so this collapses naturally.
 */

import { formatBrandDate } from "./share-utils";

export interface StatGuesserShareInput {
  avgError: number;
  anchorName: string;
  targetName: string;
}

export function buildStatGuesserShareText(
  input: StatGuesserShareInput,
  dateKey: string,
): string {
  const pct = Math.round(input.avgError);
  return [
    `Countrivo · Stat-Guesser · ${formatBrandDate(dateKey)}`,
    `🎯 Off by ${pct}%`,
    `Anchor: ${input.anchorName} → ${input.targetName}`,
    "countrivo.com",
  ].join("\n");
}
