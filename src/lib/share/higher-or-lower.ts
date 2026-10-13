/**
 * Higher or Lower share text (concept 5.5). Spoiler-safe: the stat is public (the home card
 * names it), the countries are not.
 *
 *   Countrivo Higher or Lower 12 Oct
 *   11 of 13 on population
 *   🟩🟩🟩🟩🟥🟩🟩🟩🟥🟩
 *   countrivo.com/games/higher-or-lower
 *
 * Practice carries the streak and no squares (it has no fixed length).
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface HigherOrLowerShareInput {
  practice: boolean;
  /** `YYYY-MM-DD`, the board's Berlin day. */
  dateKey: string;
  /** `population`, `land area`. */
  noun: string;
  points: number;
  max: number;
  streak: number;
  /** One per call made, in order. */
  hits: readonly boolean[];
}

/** `12 Oct` from `2026-10-12`; an unexpected key passes through unchanged. */
export function shareDay(dateKey: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  return `${Number(m[2])} ${MONTHS[Number(m[1]) - 1] ?? ""}`.trim();
}

export function buildHigherOrLowerShareText(input: HigherOrLowerShareInput): string {
  const url = "countrivo.com/games/higher-or-lower";
  if (input.practice) {
    return ["Countrivo Higher or Lower practice", `${input.streak} in a row on ${input.noun}`, url].join("\n");
  }
  return [
    `Countrivo Higher or Lower ${shareDay(input.dateKey)}`,
    `${input.points} of ${input.max} on ${input.noun}`,
    input.hits.map((h) => (h ? "🟩" : "🟥")).join(""),
    url,
  ].join("\n");
}
