// Pure country-name matching shared by GeoWordle guesses and the leaderboard flag picker.
// No data imports: callers bring their own pool, so a client sheet stays small.

export const COUNTRY_ALIASES: Readonly<Record<string, readonly string[]>> = {
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
  NLD: ["Holland"],
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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface CountryNameSource {
  iso2: string;
  iso3: string;
  name: string;
  displayName?: string;
}

export interface CountryMatchEntry<T> {
  item: T;
  keys: string[];
  words: string[];
}

/** Every spelling a country answers to: names, aliases, "St" for "Saint", ISO codes, extras. */
export function countryMatchEntry<T extends CountryNameSource>(item: T, extra: readonly string[] = []): CountryMatchEntry<T> {
  const names = [item.name, item.displayName ?? item.name, ...(COUNTRY_ALIASES[item.iso3] ?? []), ...extra];
  const keys = [...new Set([
    ...names,
    ...names.filter((name) => name.startsWith("Saint ")).map((name) => name.replace(/^Saint /, "St ")),
    item.iso2,
    item.iso3,
  ].map(normalizeCountryInput).filter(Boolean))];
  return { item, keys, words: [...new Set(keys.flatMap((key) => key.split(" ")))] };
}

export interface RankOptions<T> {
  excluded?: (item: T) => boolean;
  max?: number;
  /** "fallback" (GeoWordle): substring hits only when nothing starts with the text. "always": after them. */
  inside?: "fallback" | "always";
}

/** Exact, then name prefix, then word prefix, then substring. */
export function rankCountryMatches<T>(input: string, pool: readonly CountryMatchEntry<T>[], { excluded, max = Infinity, inside = "fallback" }: RankOptions<T> = {}): T[] {
  const needle = normalizeCountryInput(input);
  if (!needle) return [];
  const exact: T[] = [];
  const lead: T[] = [];
  const word: T[] = [];
  const within: T[] = [];
  for (const { item, keys, words } of pool) {
    if (excluded?.(item)) continue;
    if (keys.includes(needle)) exact.push(item);
    else if (keys.some((key) => key.startsWith(needle))) lead.push(item);
    else if (words.some((part) => part.startsWith(needle))) word.push(item);
    else if (keys.some((key) => key.includes(needle))) within.push(item);
  }
  const front = [...exact, ...lead, ...word];
  const ranked = inside === "always" ? [...front, ...within] : front.length > 0 ? front : within;
  return ranked.slice(0, max);
}
