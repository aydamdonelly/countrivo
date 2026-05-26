/**
 * Country Draft share-grid generator.
 *
 * Format:
 *   Countrivo · Country Draft · DD · MM · YY
 *   🟩🟨🟩🟨⬛🟩🟩🟨  Score: 1342/1944
 *                  Rank: 12th
 *   countrivo.com
 *
 * Symbol rules per pick:
 *   🟩  pickRank === optimalRank (perfect for that category)
 *   🟨  pickRank - optimalRank <= 50 (close to optimal)
 *   ⬛  otherwise
 */

import { formatBrandDate, ordinal } from "./share-utils";

interface DraftAssignmentLike {
  countryIdx: number;
  rank: number;
}

export interface CountryDraftShareInput {
  playerScore: number;
  assignments: DraftAssignmentLike[];
  optimalAssignments: DraftAssignmentLike[];
  rank?: number | null;
}

const MAX_DRAFT_SCORE = 8 * 243; // 8 picks × 243 worst rank

function symbolFor(pickRank: number, optimalRank: number): string {
  if (pickRank === optimalRank) return "🟩";
  if (pickRank - optimalRank <= 50) return "🟨";
  return "⬛";
}

export function buildCountryDraftShareText(
  input: CountryDraftShareInput,
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

  const header = `Countrivo · Country Draft · ${formatBrandDate(dateKey)}`;
  const scoreLine = `${symbols}  Score: ${input.playerScore}/${MAX_DRAFT_SCORE}`;
  const padding = " ".repeat(symbols.length + 2); // align under symbols
  const rankLine =
    input.rank != null ? `${padding}Rank: ${ordinal(input.rank)}` : null;

  const lines = [header, scoreLine];
  if (rankLine) lines.push(rankLine);
  lines.push("countrivo.com");
  return lines.join("\n");
}
