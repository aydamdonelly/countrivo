/*
 * Stat Guesser's authored tables (concept 5.6). Nothing here depends on the day or the answer.
 *
 * TIER_A is the recognition tier the concept asks for ("round 1 is population for a tier A
 * country"). The site has no computed recognition tiers yet (concept 9.3, fetch-pageviews), so
 * this is an authored list of 73 sovereign states most players can place without help. Every
 * other sovereign state counts as tier B or C here. Keep it at 65 or more: each (stat, tier)
 * pool must stay longer than the 60-day rotation window once the two references are removed.
 *
 * REFERENCES are the two fixed countries marked on every ruler for scale: tier A states that
 * sit nearest the stat's 25th and 75th percentile among sovereign states with data (measured
 * against src/data/stats.json, 2023 and 2022 vintages). A reference is never asked about its
 * own stat; the engine drops it from that stat's pool.
 *
 *   stat                  25th pct            pick    75th pct           pick
 *   population            2.0 million         JAM     31.2 million       AUS (26.7 M)
 *   area-km2              23 100 km2          ISR     521 000 km2        ESP
 *   gdp                   $13.5 billion       MDG     $268 billion       PER
 *   gdp-per-capita        $2 540              IND     $22 500            POL
 *   urban-population-pct  42.1                EGY     78.7               FRA
 *   internet-users-pct    52.3                IND     89.5               THA
 *   forest-coverage-pct   11.4                IRL     49.3               RUS
 */

/** The four magnitude stats: a log ruler from the sovereign minimum to the maximum. */
export const MAGNITUDE_STATS = ["population", "area-km2", "gdp", "gdp-per-capita"] as const;

/** The three percentage stats: a linear ruler from 0 to 100. */
export const PERCENT_STATS = ["urban-population-pct", "internet-users-pct", "forest-coverage-pct"] as const;

export type MagnitudeStat = (typeof MAGNITUDE_STATS)[number];
export type PercentStat = (typeof PERCENT_STATS)[number];
export type GuessStat = MagnitudeStat | PercentStat;

export const GUESS_STATS: readonly GuessStat[] = [...MAGNITUDE_STATS, ...PERCENT_STATS];

export const TIER_A: readonly string[] = [
  // Americas
  "USA", "CAN", "MEX", "BRA", "ARG", "CHL", "COL", "PER", "VEN", "CUB", "JAM",
  // Europe
  "GBR", "IRL", "FRA", "DEU", "ESP", "PRT", "ITA", "NLD", "BEL", "CHE", "AUT", "SWE", "NOR",
  "DNK", "FIN", "ISL", "POL", "CZE", "HUN", "GRC", "TUR", "UKR", "RUS", "ROU", "HRV",
  // Asia and Oceania
  "CHN", "JPN", "KOR", "PRK", "IND", "PAK", "BGD", "IDN", "THA", "VNM", "PHL", "MYS", "SGP",
  "AUS", "NZL", "IRN", "IRQ", "ISR", "SAU", "ARE", "QAT", "AFG", "NPL", "LKA", "MNG", "KAZ",
  // Africa
  "EGY", "MAR", "NGA", "KEN", "ZAF", "ETH", "GHA", "DZA", "TUN", "MDG", "SEN",
];

/** [lower reference, upper reference] per stat, as ISO3. */
export const REFERENCES: Readonly<Record<GuessStat, readonly [string, string]>> = {
  population: ["JAM", "AUS"],
  "area-km2": ["ISR", "ESP"],
  gdp: ["MDG", "PER"],
  "gdp-per-capita": ["IND", "POL"],
  "urban-population-pct": ["EGY", "FRA"],
  "internet-users-pct": ["IND", "THA"],
  "forest-coverage-pct": ["IRL", "RUS"],
};
