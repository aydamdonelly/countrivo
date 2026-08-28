/**
 * Stat-Guesser share text — SPOILER-SAFE.
 *
 * Format:
 *   Countrivo Stat Guesser #<dailyNumber> 🎯 off by 12%
 *
 *   https://countrivo.com
 *
 * NOTE: never print the anchor/target country names — the daily is deterministic
 * (same anchor→target for everyone today), so naming them would reveal the
 * puzzle to anyone who hasn't played yet.
 */

import { dailyNumber, gameShareUrl } from "./share-utils";

export interface StatGuesserShareInput {
  avgError: number;
  /** kept for back-compat with the caller; intentionally NOT printed (spoiler). */
  anchorName?: string;
  targetName?: string;
}

export function buildStatGuesserShareText(
  input: StatGuesserShareInput,
  dateKey: string,
): string {
  const pct = Math.round(input.avgError);
  return [
    `Countrivo Stat Guesser #${dailyNumber(dateKey)} 🎯 off by ${pct}%`,
    "",
    gameShareUrl("stat-guesser"),
  ].join("\n");
}
