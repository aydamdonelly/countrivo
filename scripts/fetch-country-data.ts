/**
 * Fetches country data from REST Countries API and World Bank API.
 * Generates: countries.json, stats.json, borders.json, capitals.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "../src/data");
mkdirSync(DATA_DIR, { recursive: true });

// Region to continent mapping
const regionToContinent: Record<string, string> = {
  Africa: "Africa",
  Americas: "Americas",
  Antarctic: "Antarctica",
  Asia: "Asia",
  Europe: "Europe",
  Oceania: "Oceania",
};

// ISO3 codes to exclude (territories, disputed, too small for meaningful stats)
const EXCLUDED = new Set([
  "ATA", // Antarctica
  "BVT", // Bouvet Island
  "IOT", // British Indian Ocean Territory
  "HMD", // Heard Island
  "SGS", // South Georgia
  "UMI", // US Minor Outlying Islands
  "ATF", // French Southern Territories
]);

interface RESTCountry {
  cca2: string;
  cca3: string;
  name: { common: string; official: string };
  region: string;
  subregion: string;
  capital?: string[];
  borders?: string[];
  flag: string;
  area: number;
  population: number;
}

interface WorldBankEntry {
  country: { id: string; value: string };
  value: number | null;
  date: string;
}

// World Bank indicators we want
const WB_INDICATORS: Record<string, { slug: string; year?: number }> = {
  "SP.POP.TOTL": { slug: "population" },
  "NY.GDP.PCAP.CD": { slug: "gdp-per-capita" },
  "NY.GDP.MKTP.CD": { slug: "gdp" },
  "SP.DYN.LE00.IN": { slug: "life-expectancy" },
  "SP.URB.TOTL.IN.ZS": { slug: "urban-population-pct" },
  "IT.NET.USER.ZS": { slug: "internet-users-pct" },
  "SP.DYN.TFRT.IN": { slug: "fertility-rate" },
  "EN.ATM.CO2E.PC": { slug: "co2-per-capita" },
  "AG.LND.FRST.ZS": { slug: "forest-coverage-pct" },
  "SL.UEM.TOTL.ZS": { slug: "unemployment-rate" },
  "MS.MIL.XPND.GD.ZS": { slug: "military-spending-pct" },
  "EG.FEC.RNEW.ZS": { slug: "renewable-energy-pct" },
  "AG.LND.ARBL.ZS": { slug: "arable-land-pct" },
  "ST.INT.ARVL": { slug: "tourism-arrivals" },
  "SE.XPD.TOTL.GD.ZS": { slug: "education-spending-pct" },
  "SH.XPD.CHEX.GD.ZS": { slug: "health-spending-pct" },
  "BX.KLT.DINV.CD.WD": { slug: "fdi-inflow" },
  "FP.CPI.TOTL.ZG": { slug: "inflation-rate" },
  "AG.SRF.TOTL.K2": { slug: "surface-area" },
  "SP.POP.DNST": { slug: "population-density" },
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchRESTCountries(): Promise<RESTCountry[]> {
  console.log("Fetching REST Countries API...");
  return fetchJSON<RESTCountry[]>(
    "https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,subregion,capital,borders,flag,area,population"
  );
}

// World Bank returns data for aggregate regions (EU, OECD, Arab World, etc.)
// alongside real countries. Filter these out to avoid corrupted data.
const WB_AGGREGATES = new Set([
  "OE", "EU", "XC", "XD", "XE", "XF", "XG", "XH", "XI", "XJ",
  "XL", "XM", "XN", "XO", "XP", "XQ", "XR", "XS", "XT",
  "XU", "XV", "XY", "ZB", "ZF", "ZG", "ZH", "ZI", "ZJ", "ZQ",
  "ZT",
]);

function isRealCountryCode(id: string): boolean {
  if (id.length !== 2) return false;
  if (/\d/.test(id)) return false;
  return !WB_AGGREGATES.has(id);
}

async function fetchWorldBankIndicator(
  indicator: string
): Promise<Map<string, { value: number; year: number }>> {
  const results = new Map<string, { value: number; year: number }>();

  // Fetch most recent data (try last 5 years to find data)
  for (const year of [2023, 2022, 2021, 2020, 2019]) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${year}&format=json&per_page=1000`;
    try {
      const data = await fetchJSON<[unknown, WorldBankEntry[] | null]>(url);
      if (!data[1]) continue;

      for (const entry of data[1]) {
        if (entry.value !== null && !results.has(entry.country.id) && isRealCountryCode(entry.country.id)) {
          results.set(entry.country.id, { value: entry.value, year });
        }
      }
    } catch {
      // Skip failed years
    }
  }
  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ISO2 to ISO3 mapping for World Bank data (uses ISO2)
const iso2ToIso3 = new Map<string, string>();

async function main() {
  // Step 1: Fetch REST Countries data
  const restCountries = await fetchRESTCountries();
  console.log(`Got ${restCountries.length} countries from REST Countries`);

  // Build country list
  const countries: Array<{
    iso2: string;
    iso3: string;
    name: string;
    displayName: string;
    slug: string;
    region: string;
    subregion: string;
    continent: string;
    flagEmoji: string;
    flagSvgPath: string;
    capital: string;
    borders: string[];
  }> = [];

  const borders: Record<string, string[]> = {};
  const capitals: Record<string, string> = {};
  const stats: Record<string, Record<string, number>> = {};

  for (const c of restCountries) {
    if (EXCLUDED.has(c.cca3)) continue;
    if (!c.cca3 || !c.name.common) continue;

    iso2ToIso3.set(c.cca2, c.cca3);

    const country = {
      iso2: c.cca2,
      iso3: c.cca3,
      name: c.name.common,
      displayName: c.name.common,
      slug: slugify(c.name.common),
      region: c.region || "Unknown",
      subregion: c.subregion || c.region || "Unknown",
      continent: regionToContinent[c.region] || "Unknown",
      flagEmoji: c.flag || "",
      flagSvgPath: `/flags/${c.cca2.toLowerCase()}.svg`,
      capital: c.capital?.[0] || "",
      borders: c.borders || [],
    };

    countries.push(country);
    borders[c.cca3] = c.borders || [];
    capitals[c.cca3] = c.capital?.[0] || "";

    // Add area and population from REST Countries as baseline
    stats[c.cca3] = {};
    if (c.area > 0) stats[c.cca3]["area-km2"] = c.area;
    if (c.population > 0) stats[c.cca3]["population"] = c.population;
  }

  // Sort by name
  countries.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Processed ${countries.length} countries`);

  // Step 2: Fetch World Bank data
  for (const [indicator, config] of Object.entries(WB_INDICATORS)) {
    console.log(`Fetching World Bank: ${indicator} -> ${config.slug}...`);
    try {
      const data = await fetchWorldBankIndicator(indicator);
      let matched = 0;

      for (const [iso2, entry] of data) {
        const iso3 = iso2ToIso3.get(iso2);
        if (iso3 && stats[iso3]) {
          stats[iso3][config.slug] = entry.value;
          matched++;
        }
      }
      console.log(`  -> ${matched} countries matched`);
    } catch (err) {
      console.error(`  -> FAILED: ${err}`);
    }

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  // Validation: check for suspicious values
  console.log("\n=== VALIDATION ===");
  const tourismTop = Object.entries(stats)
    .filter(([, s]) => s["tourism-arrivals"])
    .sort(([, a], [, b]) => b["tourism-arrivals"] - a["tourism-arrivals"])
    .slice(0, 10)
    .map(([iso3, s]) => `${iso3}: ${(s["tourism-arrivals"] / 1e6).toFixed(1)}M`);
  console.log("Top 10 tourism:", tourismTop.join(", "));

  const gdpTop = Object.entries(stats)
    .filter(([, s]) => s["gdp"])
    .sort(([, a], [, b]) => b["gdp"] - a["gdp"])
    .slice(0, 5)
    .map(([iso3, s]) => `${iso3}: $${(s["gdp"] / 1e12).toFixed(1)}T`);
  console.log("Top 5 GDP:", gdpTop.join(", "));

  const popTop = Object.entries(stats)
    .filter(([, s]) => s["population"])
    .sort(([, a], [, b]) => b["population"] - a["population"])
    .slice(0, 5)
    .map(([iso3, s]) => `${iso3}: ${(s["population"] / 1e6).toFixed(0)}M`);
  console.log("Top 5 population:", popTop.join(", "));

  // Override tourism-arrivals with authoritative UNWTO 2023 data
  // World Bank ST.INT.ARVL is unreliable: some countries report border crossings,
  // some report overnight stays, creating wildly inconsistent rankings.
  // Source: UNWTO World Tourism Barometer 2024, international tourist arrivals
  const tourismOverrides: Record<string, number> = {
    FRA: 100000000, ESP: 85000000, USA: 79400000, ITA: 57200000, TUR: 55700000,
    MEX: 42000000, GBR: 37600000, DEU: 28600000, GRC: 32700000, AUT: 31900000,
    ARE: 28000000, THA: 28000000, JPN: 25100000, CHN: 25000000, PRT: 26800000,
    SAU: 27400000, CAN: 22100000, IND: 18900000, HRV: 20600000, POL: 17400000,
    NLD: 20700000, CZE: 14000000, HUN: 15800000, MAR: 14500000, MYS: 20100000,
    SGP: 13600000, RUS: 18600000, EGY: 14900000, IDN: 14500000, CHE: 12000000,
    DNK: 12100000, SWE: 10900000, HKG: 13200000, KOR: 11000000, AUS: 9500000,
    BEL: 9300000, BGR: 10200000, IRL: 11000000, NOR: 7000000, FIN: 5700000,
    BRA: 5900000, ARG: 5500000, COL: 6000000, CHL: 4600000, DOM: 9200000,
    CUB: 3800000, ZAF: 8500000, NZL: 3200000, ISR: 3600000, PER: 3100000,
  };
  for (const [iso3, val] of Object.entries(tourismOverrides)) {
    if (stats[iso3]) stats[iso3]["tourism-arrivals"] = val;
  }
  console.log("Tourism data overridden with UNWTO 2023 data for", Object.keys(tourismOverrides).length, "countries");

  // Step 3: Add curated niche stats (hardcoded for data quality)
  const beerConsumption: Record<string, number> = {
    CZE: 184.1, AUT: 107.8, DEU: 99.0, POL: 97.7, ROU: 96.9,
    IRL: 95.2, ESP: 88.8, HRV: 85.5, LVA: 81.5, SVN: 80.0,
    NLD: 79.0, USA: 76.0, BEL: 74.6, AUS: 74.0, GBR: 71.5,
    NZL: 69.4, FIN: 68.5, SVK: 67.5, JPN: 42.6, BRA: 63.0,
    MEX: 66.0, RUS: 55.0, CHN: 36.5, ZAF: 59.4, NGA: 12.3,
    KOR: 41.8, ARG: 44.0, COL: 47.0, CHL: 35.0, VNM: 48.0,
    THA: 30.0, PHL: 23.0, IND: 2.0, IDN: 0.8, PAK: 0.1,
    TUR: 14.0, EGY: 1.0, MAR: 1.5, ETH: 8.0, KEN: 13.0,
    TZA: 10.0, GHA: 10.5, CMR: 7.0, CAN: 66.2, DNK: 59.8,
    SWE: 56.2, NOR: 55.5, CHE: 54.0, PRT: 51.0, ITA: 34.0,
    FRA: 33.0, GRC: 38.0, LTU: 88.2, EST: 69.3, HUN: 73.0,
    BGR: 63.0, SRB: 60.0, UKR: 46.0, BLR: 42.0, PER: 46.0,
    ECU: 28.0, BOL: 25.0, PRY: 35.0, URY: 30.0, PAN: 40.0,
    CRI: 38.0, GTM: 18.0, DOM: 32.0, CUB: 15.0, JAM: 22.0,
  };

  const coffeeConsumption: Record<string, number> = {
    FIN: 12.0, NOR: 9.9, ISL: 9.0, DNK: 8.7, NLD: 8.4,
    SWE: 8.2, CHE: 7.9, BEL: 6.8, CAN: 6.5, BRA: 6.1,
    AUT: 6.1, ITA: 5.9, DEU: 5.5, FRA: 5.4, USA: 4.2,
    JPN: 3.6, GBR: 3.3, AUS: 3.0, ESP: 4.5, PRT: 4.3,
    GRC: 5.4, TUR: 1.0, CZE: 4.3, POL: 3.5, HRV: 5.1,
    EST: 5.0, LVA: 4.0, LTU: 3.8, HUN: 3.1, SVN: 5.0,
    SVK: 4.0, ROU: 2.4, BGR: 2.0, SRB: 3.5, ETH: 2.3,
    COL: 2.0, CRI: 4.0, KEN: 0.2, IND: 0.1, CHN: 0.4,
    IDN: 1.2, VNM: 1.8, MEX: 1.5, ARG: 1.0, CHL: 2.0,
    KOR: 3.5, NZL: 2.8, ZAF: 0.6, RUS: 1.7, UKR: 1.5,
    ISR: 5.0, LBN: 3.5, SAU: 1.5, EGY: 0.4, NGA: 0.1,
    PER: 1.0, ECU: 1.5, PAN: 2.0, IRL: 3.5,
  };

  const wineConsumption: Record<string, number> = {
    PRT: 51.9, FRA: 46.0, ITA: 44.0, CHE: 33.0, AUT: 29.3,
    AUS: 25.0, ARG: 24.0, DEU: 24.5, GRC: 23.0, HRV: 22.5,
    DNK: 22.0, BEL: 21.0, SWE: 20.5, NLD: 20.0, GBR: 19.5,
    ESP: 21.0, CZE: 18.0, HUN: 19.0, SVN: 30.0, NZL: 18.0,
    USA: 12.5, CAN: 14.0, IRL: 17.0, ROU: 19.5, NOR: 15.0,
    URY: 20.0, CHL: 16.0, BRA: 2.0, RUS: 7.0, ZAF: 7.5,
    JPN: 3.5, KOR: 2.0, CHN: 1.5, IND: 0.1, TUR: 1.5,
    POL: 8.0, FIN: 14.0, SVK: 15.0, BGR: 12.0, SRB: 14.0,
    GEO: 8.0, MDA: 15.0, UKR: 3.0, ISR: 6.5, LBN: 5.0,
    MEX: 1.0, COL: 0.5, PER: 1.5, LTU: 10.0, LVA: 9.0,
    EST: 10.0, MKD: 10.0, ALB: 5.0, BIH: 4.0, MNE: 12.0,
  };

  // Add niche stats
  for (const [iso3, val] of Object.entries(beerConsumption)) {
    if (stats[iso3]) stats[iso3]["beer-consumption-per-capita"] = val;
  }
  for (const [iso3, val] of Object.entries(coffeeConsumption)) {
    if (stats[iso3]) stats[iso3]["coffee-consumption-per-capita"] = val;
  }
  for (const [iso3, val] of Object.entries(wineConsumption)) {
    if (stats[iso3]) stats[iso3]["wine-consumption-per-capita"] = val;
  }

  // Step 4: Write output files
  writeFileSync(join(DATA_DIR, "countries.json"), JSON.stringify(countries, null, 2));
  writeFileSync(join(DATA_DIR, "stats.json"), JSON.stringify(stats, null, 2));
  writeFileSync(join(DATA_DIR, "borders.json"), JSON.stringify(borders, null, 2));
  writeFileSync(join(DATA_DIR, "capitals.json"), JSON.stringify(capitals, null, 2));

  console.log("\nFiles written:");
  console.log(`  countries.json: ${countries.length} countries`);
  console.log(`  stats.json: ${Object.keys(stats).length} countries with stats`);
  console.log(`  borders.json: ${Object.keys(borders).length} entries`);
  console.log(`  capitals.json: ${Object.keys(capitals).length} entries`);

  // Report coverage
  const allSlugs = new Set<string>();
  for (const s of Object.values(stats)) {
    for (const key of Object.keys(s)) allSlugs.add(key);
  }
  console.log(`\nStat categories found: ${allSlugs.size}`);
  for (const slug of [...allSlugs].sort()) {
    const count = Object.values(stats).filter((s) => s[slug] !== undefined && s[slug] !== null).length;
    console.log(`  ${slug}: ${count}/${countries.length} countries (${((count / countries.length) * 100).toFixed(0)}%)`);
  }
}

main().catch(console.error);
