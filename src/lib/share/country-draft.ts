/**
 * Country Draft share text (SPEC 18). Never rendered on screen.
 *
 *   Countrivo · Country Draft · #240
 *   154 of 195 · Most of the map.
 *   fits 25 · 25 · 25 · 25 · 6
 *   rank 12th
 *   https://countrivo.com/games/country-draft
 *
 * No emoji: five fit values in the house's own middle-dot grammar say more than a row of
 * coloured squares, read as ours rather than as a Wordle clone, and survive every client
 * that mangles emoji.
 *
 * Spoiler safety: sorting the fits descending destroys the seat order, so the line reveals
 * the multiset of fits you achieved and nothing else. No name, no country, no seat, no
 * archetype, no standing. A reader learns that somebody found four naturals today, which
 * is the same class of information a Wordle grid leaks.
 */
import { dailyNumber, gameShareUrl, ordinal } from "./share-utils";

export interface CountryDraftShareInput {
  score: number;
  /** The band sentence, `Most of the map.` */
  band: string;
  /** The five fit values, in any order; the line sorts them. */
  fits: readonly number[];
  rank?: number | null;
  practice?: boolean;
}

const MAX_SCORE = 195;

export function buildCountryDraftShareText(input: CountryDraftShareInput, dateKey: string): string {
  const header = input.practice
    ? "Countrivo · Country Draft · practice"
    : `Countrivo · Country Draft · #${dailyNumber(dateKey)}`;
  const lines = [header, `${input.score} of ${MAX_SCORE} · ${input.band}`];
  if (input.fits.length > 0) {
    lines.push(`fits ${[...input.fits].sort((a, b) => b - a).join(" · ")}`);
  }
  if (!input.practice && input.rank != null) lines.push(`rank ${ordinal(input.rank)}`);
  lines.push(gameShareUrl("country-draft"));
  return lines.join("\n");
}
