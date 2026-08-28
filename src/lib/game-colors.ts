/**
 * Unique color palette for each game — used across the site for visual identity.
 *
 * Values are CSS variables (defined in globals.css with light + dark twins),
 * NOT hardcoded hex, so the per-game washes flip automatically with the color
 * scheme when applied via inline `style`. The var() fallback covers the rare
 * unknown slug. Do not feed these into a <canvas> / Satori OG image — `var()`
 * does not resolve there (no current call site does this).
 */
const GAME_SLUGS = [
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
] as const;

function gameColor(slug: string): { bg: string; text: string } {
  return {
    bg: `var(--game-${slug}-bg, var(--color-surface-elevated))`,
    text: `var(--game-${slug}-fg, var(--color-cream))`,
  };
}

export const GAME_COLORS: Record<string, { bg: string; text: string }> =
  Object.fromEntries(GAME_SLUGS.map((slug) => [slug, gameColor(slug)]));

export function getGameColor(slug: string): { bg: string; text: string } {
  return GAME_COLORS[slug] ?? { bg: "var(--color-surface-elevated)", text: "var(--color-cream)" };
}
