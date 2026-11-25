/**
 * Capital Quiz share text. Practice only, so no date. Spoiler-free: the score and one square
 * per country, in board order, and never a country or a city.
 *
 *   Countrivo Capital Quiz practice, Europe
 *   8 of 10
 *   🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩
 *   https://countrivo.com/games/capital-quiz
 *
 * The link sits alone on the last line like every other share, so it auto-links.
 */
import { gameShareUrl } from "./share-utils";

export interface CapitalQuizShareInput {
  score: number;
  total: number;
  /** Right or wrong per country, in board order. */
  hits: readonly boolean[];
  /** The continent filter's name, or null for the whole world. */
  scope: string | null;
}

export function buildCapitalQuizShare(input: CapitalQuizShareInput): string {
  return [
    `Countrivo Capital Quiz practice${input.scope ? `, ${input.scope}` : ""}`,
    `${input.score} of ${input.total}`,
    input.hits.map((ok) => (ok ? "🟩" : "🟥")).join(""),
    gameShareUrl("capital-quiz"),
  ].join("\n");
}
