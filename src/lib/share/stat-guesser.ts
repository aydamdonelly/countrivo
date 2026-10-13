/**
 * Stat Guesser share text (concept 5.6). Spoiler-free: no country, stat or value.
 *
 *   Countrivo Stat Guesser 12 Oct
 *   412 of 600
 *   🟩🟨🟩⬜🟩
 *   https://countrivo.com/games/stat-guesser
 *
 * One square per round by the round's points before doubling: green 80 or more, yellow 50
 * to 79, white below 50. The link stays a full https URL on the last line so it auto-links.
 */
import { gameShareUrl } from "./share-utils";

export interface StatGuesserShareInput {
  total: number;
  max: number;
  /** Points per round before doubling, 0 to 100. */
  points: readonly number[];
  practice?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-10-12` as `12 Oct`. */
function shortDate(dateKey: string): string {
  const m = dateKey.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${Number(m[2])} ${MONTHS[Number(m[1]) - 1] ?? ""}`.trim();
}

export function statGuesserSquare(points: number): string {
  if (points >= 80) return "🟩";
  if (points >= 50) return "🟨";
  return "⬜";
}

export function buildStatGuesserShareText(input: StatGuesserShareInput, dateKey: string): string {
  const head = input.practice ? "Countrivo Stat Guesser practice" : `Countrivo Stat Guesser ${shortDate(dateKey)}`.trim();
  return [head, `${input.total} of ${input.max}`, input.points.map(statGuesserSquare).join(""), gameShareUrl("stat-guesser")].join("\n");
}
