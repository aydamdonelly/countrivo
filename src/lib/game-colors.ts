/** Unique color palette for each game — used across the site for visual identity */
export const GAME_COLORS: Record<string, { bg: string; text: string }> = {
  "country-draft":    { bg: "#fee2e2", text: "#991b1b" },
  "flag-quiz":        { bg: "#dbeafe", text: "#1e3a5f" },
  "higher-or-lower":  { bg: "#d1fae5", text: "#064e3b" },
  "capital-match":    { bg: "#fef3c7", text: "#78350f" },
  "population-sort":  { bg: "#ede9fe", text: "#4c1d95" },
  "country-streak":   { bg: "#ffedd5", text: "#7c2d12" },
  "border-buddies":   { bg: "#ccfbf1", text: "#134e4a" },
  "continent-sprint": { bg: "#e0e7ff", text: "#312e81" },
  "stat-guesser":     { bg: "#fce7f3", text: "#831843" },
  "speed-flags":      { bg: "#ecfccb", text: "#365314" },
  "odd-one-out":      { bg: "#f3e8ff", text: "#581c87" },
  "supremacy":        { bg: "#fef9c3", text: "#713f12" },
  "borderline":       { bg: "#cffafe", text: "#155e75" },
  "blitz":            { bg: "#fecaca", text: "#7f1d1d" },
};

export function getGameColor(slug: string) {
  return GAME_COLORS[slug] ?? { bg: "#f3f4f6", text: "#374151" };
}
