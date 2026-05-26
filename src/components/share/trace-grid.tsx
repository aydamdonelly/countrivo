/**
 * Trace share-grid generator.
 *
 * Format:
 *   Countrivo · Trace · DD · MM · YY
 *   🟩🟩🟩⬛⬛⬛  4/6
 *   🟩⬛🟩⬛🟩⬛
 *   ...
 *   countrivo.com
 *
 * Each row = one guess. Six squares per row, one per category:
 *   🟩  direction === "match" (correct on that stat)
 *   🟨  direction === "higher" | "lower" (warmer)
 *   ⬛  direction === "unknown" (no data)
 *
 * Final line: guesses/6 if won, X/6 if lost.
 */

import { formatBrandDate } from "./share-utils";

interface TraceGuessLike {
  comparisons: { direction: "higher" | "lower" | "match" | "unknown" }[];
  isCorrect: boolean;
}

export interface TraceShareInput {
  guesses: TraceGuessLike[];
  won: boolean;
  maxGuesses: number;
}

function symbolFor(direction: TraceGuessLike["comparisons"][number]["direction"]): string {
  if (direction === "match") return "🟩";
  if (direction === "higher" || direction === "lower") return "🟨";
  return "⬛";
}

export function buildTraceShareText(
  input: TraceShareInput,
  dateKey: string,
): string {
  const rows = input.guesses.map((g) =>
    g.comparisons.map((c) => symbolFor(c.direction)).join(""),
  );

  const header = `Countrivo · Trace · ${formatBrandDate(dateKey)}`;
  const scoreLabel = input.won ? `${input.guesses.length}/${input.maxGuesses}` : `X/${input.maxGuesses}`;

  // Score sits next to the last guess row.
  if (rows.length > 0) {
    rows[rows.length - 1] = `${rows[rows.length - 1]}  ${scoreLabel}`;
  }

  return [header, ...rows, "countrivo.com"].join("\n");
}
