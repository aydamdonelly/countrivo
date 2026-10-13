/**
 * GeoWordle share-grid generator.
 *
 * Format:
 *   Countrivo · GeoWordle · #213 · 4/6
 *   ⬛🟦🟨🟩
 *   https://countrivo.com/games/geo-wordle
 *
 * One square per guess, coloured by proximity band — never the country, never
 * the direction, so the grid is spoiler-safe for anyone who has not played yet.
 *
 * The emoji palette has no distinct "deep orange", so the share ramp runs
 * red → black where the board's `--color-geo-*` ramp runs orange → blue. Both
 * are hot-to-cold and read the same way; only the pigment differs.
 */

import { dailyNumber, gameShareUrl } from "./share-utils";

/** Mirrors GeoBand in game-logic/geo-wordle/engine.ts. */
const BAND_SQUARE: Record<string, string> = {
  hit: "🟩",
  burning: "🟧",
  hot: "🟧",
  warm: "🟨",
  cool: "⬜",
  cold: "⬜",
};

const MAX_GUESSES = 6;

interface GeoWordleGuessLike {
  band?: string;
  correct?: boolean;
}

export interface GeoWordleShareInput {
  won: boolean;
  guesses: GeoWordleGuessLike[];
  clueAt?: number | null;
}

export function buildGeoWordleShareText(input: GeoWordleShareInput, dateKey: string): string {
  const used = input.won ? input.guesses.length + (input.clueAt == null ? 0 : 1) : MAX_GUESSES;
  const scoreDisplay = input.won ? `${used}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;

  // Guesses persisted before the band field existed fall back to the coldest
  // square rather than dropping out of the grid.
  const squareRows = input.guesses
    .map((g) => BAND_SQUARE[g.correct ? "hit" : (g.band ?? "cold")] ?? BAND_SQUARE.cold)
    ;
  if (input.clueAt != null) squareRows.splice(input.clueAt, 0, "⬛");
  const squares = squareRows.join("");

  return [
    `Countrivo · GeoWordle · #${dailyNumber(dateKey)} · ${scoreDisplay}`,
    squares,
    gameShareUrl("geo-wordle"),
  ].join("\n");
}
