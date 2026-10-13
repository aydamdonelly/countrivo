/**
 * Blind Pick share text (concept 5.7). Clipboard only, never rendered.
 *
 * Daily:
 *   Countrivo Blind Pick 12 Oct
 *   +6 over perfect
 *   🟩🟩🟨🟩⬜🟩
 *   https://countrivo.com/games/blind-pick
 *
 * Practice:
 *   Countrivo Blind Pick practice: +14
 *   https://countrivo.com/games/blind-pick
 *
 * Squares, one per country in arrival order: 🟩 the placement matches the perfect board,
 * 🟨 within 10 ranks of its perfect rank, ⬜ otherwise. No country or stat is named, so the
 * daily stays unspoiled.
 */
import type { PlacementMark } from "@/lib/game-logic/blind-pick/scoring";
import { gameShareUrl } from "./share-utils";

export interface BlindPickShareInput {
  /** Golf: 0 is perfect. */
  over: number;
  /** One mark per country, in arrival order. */
  marks: readonly PlacementMark[];
  practice: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SQUARE: Record<PlacementMark, string> = { match: "🟩", near: "🟨", off: "⬜" };

/** `2026-10-12` as `12 Oct`, read from the key itself so no time zone can shift it. */
function shortDate(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""}`.trim();
}

export function buildBlindPickShareText(input: BlindPickShareInput, dateKey: string): string {
  const score = input.over === 0 ? "Perfect" : `+${input.over}`;
  const url = gameShareUrl("blind-pick");
  if (input.practice) return [`Countrivo Blind Pick practice: ${score}`, url].join("\n");
  const date = shortDate(dateKey);
  return [
    date ? `Countrivo Blind Pick ${date}` : "Countrivo Blind Pick",
    input.over === 0 ? "Perfect" : `${score} over perfect`,
    input.marks.map((m) => SQUARE[m]).join(""),
    url,
  ].join("\n");
}
