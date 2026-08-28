import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/server";

/** The two modes. There is no third. */
export type Mode = "daily" | "practice";

/** The 18 registry slugs (17 playable plus World Draft, which has no play route). */
export type GameSlug =
  | "country-draft"
  | "flag-quiz"
  | "higher-or-lower"
  | "capital-match"
  | "population-sort"
  | "country-streak"
  | "border-buddies"
  | "continent-sprint"
  | "stat-guesser"
  | "speed-flags"
  | "odd-one-out"
  | "supremacy"
  | "borderline"
  | "blitz"
  | "geo-wordle"
  | "cluster"
  | "risk-zone"
  | "world-draft";

export const GAME_SLUGS: readonly GameSlug[] = [
  "country-draft",
  "flag-quiz",
  "higher-or-lower",
  "capital-match",
  "population-sort",
  "country-streak",
  "border-buddies",
  "continent-sprint",
  "stat-guesser",
  "speed-flags",
  "odd-one-out",
  "supremacy",
  "borderline",
  "blitz",
  "geo-wordle",
  "cluster",
  "risk-zone",
  "world-draft",
];

export function isGameSlug(s: string): s is GameSlug {
  return (GAME_SLUGS as readonly string[]).includes(s);
}

/**
 * Who is looking (blueprint 9.1 step 2). Resolved once per request on the server
 * from the Supabase session and one `profiles` select; guests get signedIn false,
 * name null, crest null, streak null. `crest` is the silhouette path of the chosen
 * country, or null for the seed crest. Client components receive the resolved
 * fields; they never load silhouettes themselves.
 */
export interface Viewer {
  signedIn: boolean;
  user: User | null;
  profile: Profile | null;
  /** Display name, falling back to the username. */
  name: string | null;
  crest: string | null;
  /** profiles.streak_current; null for guests. */
  streak: number | null;
}

export const GUEST_VIEWER: Viewer = { signedIn: false, user: null, profile: null, name: null, crest: null, streak: null };

/** The server clock (blueprint 9.1 step 4): one snapshot per request. */
export interface Clock {
  /** Date.now() on the server. */
  now: number;
  /** Today's YYYY-MM-DD in Europe/Berlin. */
  dateKey: string;
  /** Epoch ms of the next Europe/Berlin midnight. */
  resetAt: number;
}

/** A token colour name (never a hex). Components map it to var(--color-*). */
export type Tone =
  | "ink"
  | "ink-2"
  | "paper"
  | "card"
  | "line"
  | "bar"
  | "wait"
  | "faint"
  | "mute"
  | "down"
  | "ember"
  | "on-ink"
  | "on-ink-body"
  | "on-ink-kicker"
  | "on-ink-chip";

export function toneVar(tone: Tone): string {
  return `var(--color-${tone})`;
}
