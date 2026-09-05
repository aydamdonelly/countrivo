import { countries, centroids } from "@/lib/data/loader";
import type { Country } from "@/types/country";

const ALIASES: Readonly<Record<string, readonly string[]>> = {
  ARE: ["UAE", "U A E"],
  BHS: ["The Bahamas"],
  BIH: ["Bosnia Herzegovina"],
  BRN: ["Brunei Darussalam"],
  CIV: ["Côte d'Ivoire", "Cote d Ivoire"],
  COD: ["Democratic Republic of the Congo", "Democratic Republic of Congo", "DRC", "Congo Kinshasa"],
  COG: ["Republic of Congo", "Congo Brazzaville"],
  CPV: ["Cabo Verde"],
  CZE: ["Czech Republic"],
  FSM: ["Federated States of Micronesia"],
  GBR: ["UK", "U K"],
  GMB: ["The Gambia"],
  KOR: ["Republic of Korea"],
  LAO: ["Lao PDR", "Lao People's Democratic Republic"],
  MAC: ["Macao"],
  MDA: ["Republic of Moldova"],
  MMR: ["Burma"],
  PRK: ["DPRK", "Democratic People's Republic of Korea"],
  RUS: ["Russian Federation"],
  SWZ: ["Swaziland"],
  TLS: ["East Timor"],
  TUR: ["Türkiye"],
  TZA: ["United Republic of Tanzania"],
  USA: ["United States of America", "U S", "U S A"],
  VAT: ["Vatican", "Holy See"],
  VNM: ["Viet Nam"],
};

/** Share the same spelling rules between exact submission and suggestions. */
export function normalizeCountryInput(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const POOL = countries.filter((country) => centroids[country.iso3] != null).map((country) => {
  const names = [country.name, country.displayName, ...(ALIASES[country.iso3] ?? [])];
  const keys = [...new Set([
    ...names,
    ...names.filter((name) => name.startsWith("Saint ")).map((name) => name.replace(/^Saint /, "St ")),
    country.iso2,
    country.iso3,
  ].map(normalizeCountryInput))];
  return { country, keys, words: [...new Set(keys.flatMap((key) => key.split(" ")))] };
});

/** Partial or ambiguous names require an explicit suggestion selection. */
export function resolveGuess(input: string): Country | null {
  const needle = normalizeCountryInput(input);
  if (!needle) return null;
  const matches = POOL.filter(({ keys }) => keys.includes(needle));
  return matches.length === 1 ? matches[0].country : null;
}

export function suggestCountries(
  input: string,
  excluded: ReadonlySet<string> = new Set(),
  max = 5,
): Country[] {
  const needle = normalizeCountryInput(input);
  if (!needle) return [];
  const exact: Country[] = [];
  const lead: Country[] = [];
  const word: Country[] = [];
  const inside: Country[] = [];
  for (const { country, keys, words } of POOL) {
    if (excluded.has(country.iso3)) continue;
    if (keys.includes(needle)) exact.push(country);
    else if (keys.some((key) => key.startsWith(needle))) lead.push(country);
    else if (words.some((part) => part.startsWith(needle))) word.push(country);
    else if (keys.some((key) => key.includes(needle))) inside.push(country);
  }
  const ranked = exact.length + lead.length + word.length > 0 ? [...exact, ...lead, ...word] : inside;
  return ranked.slice(0, max);
}
