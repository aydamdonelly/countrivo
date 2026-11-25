import { countries, centroids } from "@/lib/data/public";
import type { Country } from "@/types/country";
import { countryMatchEntry, normalizeCountryInput, rankCountryMatches } from "./names";

export { normalizeCountryInput };

const POOL = countries.filter((country) => centroids[country.iso3] != null).map((country) => countryMatchEntry(country));

/** Partial or ambiguous names require an explicit suggestion selection. */
export function resolveGuess(input: string): Country | null {
  const needle = normalizeCountryInput(input);
  if (!needle) return null;
  const matches = POOL.filter(({ keys }) => keys.includes(needle));
  return matches.length === 1 ? matches[0].item : null;
}

export function suggestCountries(
  input: string,
  excluded: ReadonlySet<string> = new Set(),
  max = 5,
): Country[] {
  return rankCountryMatches(input, POOL, { excluded: (country) => excluded.has(country.iso3), max });
}
