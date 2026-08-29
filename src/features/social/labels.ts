import type { GameSlug } from "@/ui/types";

/**
 * One short word per game for the friend rows, where the mark already says which game it is
 * (`draft 612 · hol 14 · wordle 3/6`, blueprint 7.14). Full titles are used everywhere a row
 * has the room for them.
 */
const SHORT: Record<GameSlug, string> = {
  "country-draft": "draft",
  "world-draft": "world",
  "flag-quiz": "flags",
  "higher-or-lower": "hol",
  "capital-match": "capitals",
  "population-sort": "sort",
  "country-streak": "streak",
  "border-buddies": "borders",
  "continent-sprint": "sprint",
  "stat-guesser": "stats",
  "speed-flags": "speed",
  "odd-one-out": "odd",
  supremacy: "cards",
  borderline: "route",
  blitz: "blitz",
  "geo-wordle": "wordle",
  cluster: "cluster",
  "risk-zone": "risk",
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
  return d;
}
