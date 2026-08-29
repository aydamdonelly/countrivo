import type { GameSlug } from "@/ui/types";

/**
 * One short word per game for the friend rows, where the mark already says which game it is
 * (`draft 612 · hol 14 · wordle 3/6`, blueprint 7.14). Full titles are used everywhere a row
 * has the room for them.
 */
const SHORT: Record<GameSlug, string> = {
  "country-draft": "draft",
  "blind-pick": "blind",
  "higher-or-lower": "hol",
  "geo-wordle": "wordle",
  "stat-guesser": "stats",
  "flag-quiz": "flags",
  "speed-flags": "speed",
};

export function shortGameLabel(slug: GameSlug): string {
  return SHORT[slug];
}

/**
 * The score as it reads in a dense row. `compactScore` already turns "Score: 612 (Gap: 424)"
 * into "612" and keeps short displays whole; the one display it cannot shorten is Stat
 * Guesser's "18% avg error", where the number alone says it next to the mark.
 */
export function shotScore(display: string | null | undefined): string {
  const d = (display ?? "").trim();
  const m = d.match(/^(?:Score|Streak):\s*([^\s(]+)/i);
  if (m) return m[1];
  const avg = d.match(/^([\d.]+\s*%)\s*avg error$/i);
  if (avg) return avg[1].replace(/\s+/g, "");
  /* A fraction is written `4/10` here and in every meta the blueprint spells out, so a
     game that saved it as `4 / 10` still reads the same as its own best line two rows
     below it. */
  return d.replace(/\s*\/\s*/g, "/");
}
