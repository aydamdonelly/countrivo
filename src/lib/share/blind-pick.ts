/**
 * Blind Pick share-grid generator.
 *
 * Format:
 *   Countrivo · Blind Pick · DD · MM · YY
 *   🟩🟨🟩🟨⬛🟩🟩🟨  Score: 1342/1944
 *                  Rank: 12th
 *   countrivo.com
 *
 * Symbol rules per pick:
 *   🟩  pickRank === optimalRank (perfect for that category)
 *   🟨  pickRank - optimalRank <= 50 (close to optimal)
 *   ⬛  otherwise
 */

import { dailyNumber, gameShareUrl, ordinal } from "./share-utils";

interface AssignmentLike {
  countryIdx: number;
  rank: number;
}

export interface BlindPickShareInput {
  playerScore: number;
  assignments: AssignmentLike[];
  optimalAssignments: AssignmentLike[];
  rank?: number | null;
}

const MAX_SCORE = 8 * 243; // 8 picks × 243 worst rank

function symbolFor(pickRank: number, optimalRank: number): string {
  if (pickRank === optimalRank) return "🟩";
  if (pickRank - optimalRank <= 50) return "🟨";
  return "⬛";
}

export function buildBlindPickShareText(
  input: BlindPickShareInput,
  dateKey: string,
): string {
  const optimalByCountry = new Map<number, number>();
  for (const opt of input.optimalAssignments) {
    optimalByCountry.set(opt.countryIdx, opt.rank);
  }

  const ordered = [...input.assignments].sort((a, b) => a.countryIdx - b.countryIdx);
  const symbols = ordered
    .map((pa) => symbolFor(pa.rank, optimalByCountry.get(pa.countryIdx) ?? pa.rank))
    .join("");

  // Match every other game's share grid: a #<dayNumber> puzzle id (not a date)
  // and a full https:// link on its own last line so it auto-links in iMessage /
  // WhatsApp / X.
  const header = `Countrivo · Blind Pick · #${dailyNumber(dateKey)}`;
  const scoreLine = `${symbols}  Score: ${input.playerScore}/${MAX_SCORE}`;
  const padding = " ".repeat(symbols.length + 2); // align under symbols
  const rankLine =
    input.rank != null ? `${padding}Rank: ${ordinal(input.rank)}` : null;

  const lines = [header, scoreLine];
  if (rankLine) lines.push(rankLine);
  lines.push(gameShareUrl("blind-pick"));
  return lines.join("\n");
}
