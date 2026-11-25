/**
 * Adds the derived statistics that Blind Pick's rotating deck needs, without a new
 * download and without touching a single existing value:
 *
 *   population-density  population / area-km2, both already in stats.json
 *   latitude            the centroid latitude from centroids.json (gavinr, CC0)
 *
 * The script only adds data. Every existing key of stats.json keeps its value and its
 * position; the two new keys are appended to each country that has the inputs, and the
 * two category entries are appended to categories.json (or refreshed in place on a re-run).
 * It never re-runs scripts/fetch-country-data.ts, which would refresh every value and
 * re-deal Higher or Lower, Stat Guesser and Draft boards.
 *
 * Run, then recompute the derived files:
 *   npx tsx scripts/build-blind-pick-stats.ts
 *   npx tsx scripts/compute-ranks.ts
 *   npx tsx scripts/build-data-timestamps.ts
 *
 * Data rule: never hand-edit JSON in src/data. Regenerate with this script.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(__dirname, "../src/data");

type StatTable = Record<string, Record<string, number | null>>;

interface CategoryRecord {
  slug: string;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  direction: string;
  source: string;
  sourceYear: number;
  coveragePercent: number;
  clarifier?: string;
}

const statsPath = join(DATA_DIR, "stats.json");
const categoriesPath = join(DATA_DIR, "categories.json");
const stats: StatTable = JSON.parse(readFileSync(statsPath, "utf8"));
const categories: CategoryRecord[] = JSON.parse(readFileSync(categoriesPath, "utf8"));
const centroids: Record<string, number[]> = JSON.parse(readFileSync(join(DATA_DIR, "centroids.json"), "utf8"));

/** Derived values, keyed by slug, then iso3. */
const DERIVED: Record<string, (iso3: string, row: Record<string, number | null>) => number | null> = {
  "population-density": (_iso3, row) => {
    const population = row.population;
    const area = row["area-km2"];
    if (typeof population !== "number" || typeof area !== "number" || !(area > 0) || !(population > 0)) return null;
    return Number((population / area).toFixed(2));
  },
  latitude: (iso3) => {
    const point = centroids[iso3];
    const lat = point?.[0];
    return typeof lat === "number" && Number.isFinite(lat) ? lat : null;
  },
};

const counts: Record<string, number> = {};
for (const [iso3, row] of Object.entries(stats)) {
  for (const [slug, derive] of Object.entries(DERIVED)) {
    const value = derive(iso3, row);
    if (value === null) {
      delete row[slug];
      continue;
    }
    // Assigning an existing key keeps its position; a new key is appended after every existing one.
    row[slug] = value;
    counts[slug] = (counts[slug] ?? 0) + 1;
  }
}

const total = Object.keys(stats).length;
const coverage = (slug: string): number => Math.round(((counts[slug] ?? 0) / total) * 100);

const ENTRIES: CategoryRecord[] = [
  {
    slug: "population-density",
    label: "Population Density",
    shortLabel: "Density",
    unit: "people per km²",
    description: "Population divided by total area: how many people live on each square kilometer",
    direction: "neutral",
    source: "World Bank / REST Countries",
    sourceYear: 2023,
    coveragePercent: coverage("population-density"),
    clarifier: "people per km²",
  },
  {
    slug: "latitude",
    label: "Latitude",
    shortLabel: "Furthest North",
    unit: "° latitude",
    description: "Latitude of the country's geographic centre. North is positive, so the highest value lies furthest north",
    direction: "neutral",
    source: "World Countries Centroids",
    sourceYear: 2026,
    coveragePercent: coverage("latitude"),
    clarifier: "latitude of centre",
  },
];

for (const entry of ENTRIES) {
  const at = categories.findIndex((c) => c.slug === entry.slug);
  if (at === -1) categories.push(entry);
  else categories[at] = entry;
}

writeFileSync(statsPath, JSON.stringify(stats, null, 2));
writeFileSync(categoriesPath, `${JSON.stringify(categories, null, 2)}\n`);
for (const slug of Object.keys(DERIVED)) console.log(`${slug}: ${counts[slug] ?? 0} of ${total} countries`);
