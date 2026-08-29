/**
 * Chip labels for the 20 draft categories, keyed by category slug (blueprint 10.6).
 * Used for the anchor-card chips and the Draft slots. military-spending-pct is not a
 * draft category; its label on ranking pages stays the registry shortLabel.
 */
export const CHIP_LABELS: Record<string, string> = {
  population: "Population",
  "area-km2": "Land area",
  "gdp-per-capita": "GDP per person",
  gdp: "Total GDP",
  "life-expectancy": "Life expectancy",
  "urban-population-pct": "Urban share",
  "internet-users-pct": "Internet users",
  "fertility-rate": "Fertility",
  "tourism-arrivals": "Tourists",
  "forest-coverage-pct": "Forest cover",
  "unemployment-rate": "Unemployment",
  "renewable-energy-pct": "Renewables",
  "inflation-rate": "Inflation",
  "beer-consumption-per-capita": "Beer",
  "coffee-consumption-per-capita": "Coffee",
  "wine-consumption-per-capita": "Wine",
  "arable-land-pct": "Farmland",
  "education-spending-pct": "Education spend",
  "health-spending-pct": "Health spend",
  "fdi-inflow": "Foreign investment",
};

/** The chip label for a category slug; falls back to the slug so nothing renders empty. */
export function chipLabel(slug: string): string {
  return CHIP_LABELS[slug] ?? slug;
}

/** The eight fixed chips on the Country Draft landing (blueprint 7.3). */
export const LANDING_DRAFT_CHIPS = [
  "Population",
  "Land area",
  "GDP per person",
  "Life expectancy",
  "Tourists",
  "Forest cover",
  "Coffee",
  "Internet users",
] as const;
