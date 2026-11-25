/**
 * Flag Quiz share text (concept 5.4). Spoiler-free: the points and one square per flag, in
 * board order, and never a country name.
 *
 *   Countrivo Flag Quiz 12 Oct
 *   11 of 13
 *   🟩🟩🟩🟩🟩🟩🟩🟥🟩🟩
 *   countrivo.com/games/flag-quiz
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface FlagQuizShareInput {
  points: number;
  max: number;
  /** Right or wrong per flag, in board order. */
  hits: readonly boolean[];
  /** Berlin `YYYY-MM-DD`. */
  dateKey: string;
  practice: boolean;
}

/** `12 Oct` from `2026-10-12`; null for a key that is not a date. */
function shortDate(dateKey: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month}` : null;
}

export function buildFlagQuizShareText(input: FlagQuizShareInput): string {
  const date = shortDate(input.dateKey);
  const head = input.practice ? "Countrivo Flag Quiz practice" : `Countrivo Flag Quiz${date ? ` ${date}` : ""}`;
  return [
    head,
    `${input.points} of ${input.max}`,
    input.hits.map((ok) => (ok ? "🟩" : "🟥")).join(""),
    "countrivo.com/games/flag-quiz",
  ].join("\n");
}

export interface FlagSprintShareInput {
  /** Right answers. */
  correct: number;
  /** Right or wrong per answered flag, in board order. */
  hits: readonly boolean[];
  seconds: number;
  /** Berlin `YYYY-MM-DD`. */
  dateKey: string;
  practice: boolean;
}

/**
 * The sprint share text: the count in the headline and one square per answered flag, ten to
 * a line, never a country name.
 *
 *   Countrivo Flag Quiz 25 Nov: 11 flags in 20 s
 *   🟩🟩🟥🟩🟩🟩🟩🟩🟩🟥
 *   🟩🟩🟩
 *   countrivo.com/games/flag-quiz
 */
export function buildFlagSprintShareText(input: FlagSprintShareInput): string {
  const date = shortDate(input.dateKey);
  const head = input.practice ? "Countrivo Flag Quiz practice" : `Countrivo Flag Quiz${date ? ` ${date}` : ""}`;
  const count = `${input.correct} ${input.correct === 1 ? "flag" : "flags"} in ${input.seconds} s`;
  const squares = input.hits.map((ok) => (ok ? "🟩" : "🟥"));
  const lines: string[] = [];
  for (let i = 0; i < squares.length; i += 10) lines.push(squares.slice(i, i + 10).join(""));
  return [`${head}: ${count}`, ...lines, "countrivo.com/games/flag-quiz"].join("\n");
}
