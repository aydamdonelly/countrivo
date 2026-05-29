/**
 * Rewrites ambiguous metric labels in src/data/categories.json so a player
 * instantly knows exactly what each metric is (per person? %? of GDP? total?).
 * Adds a `clarifier` sub-label (unit/basis) surfaced under the button text.
 *
 * Run: npx tsx scripts/clarify-category-labels.ts
 */
import fs from "node:fs";
import path from "node:path";

interface Category {
  slug: string;
  label: string;
  shortLabel: string;
  clarifier?: string;
  [key: string]: unknown;
}

const file = path.join(process.cwd(), "src/data/categories.json");
const cats: Category[] = JSON.parse(fs.readFileSync(file, "utf8"));

// slug -> { label?, shortLabel, clarifier }. label = full name (aria + headers),
// shortLabel = button text, clarifier = tiny unit/basis line.
const updates: Record<string, { label?: string; shortLabel: string; clarifier: string }> = {
  "population": { shortLabel: "Population", clarifier: "total people" },
  "area-km2": { label: "Land Area", shortLabel: "Land Area", clarifier: "total km²" },
  "gdp-per-capita": { label: "GDP per Person", shortLabel: "GDP / Person", clarifier: "USD per person" },
  "gdp": { label: "Total GDP", shortLabel: "Total GDP", clarifier: "USD · whole economy" },
  "life-expectancy": { shortLabel: "Life Expectancy", clarifier: "years, at birth" },
  "urban-population-pct": { label: "Urban Population", shortLabel: "Urban %", clarifier: "% living in cities" },
  "internet-users-pct": { label: "Internet Users", shortLabel: "Internet %", clarifier: "% of people online" },
  "fertility-rate": { label: "Fertility Rate", shortLabel: "Fertility", clarifier: "children per woman" },
  "tourism-arrivals": { label: "Tourist Arrivals", shortLabel: "Tourists", clarifier: "visitors per year" },
  "forest-coverage-pct": { label: "Forest Cover", shortLabel: "Forest %", clarifier: "% of land forested" },
  "unemployment-rate": { label: "Unemployment Rate", shortLabel: "Unemployment %", clarifier: "% of labor force" },
  "military-spending-pct": { label: "Military Spending", shortLabel: "Military % GDP", clarifier: "% of GDP" },
  "renewable-energy-pct": { label: "Renewable Energy", shortLabel: "Renewables %", clarifier: "% of energy use" },
  "inflation-rate": { label: "Inflation Rate", shortLabel: "Inflation %", clarifier: "annual CPI change" },
  "beer-consumption-per-capita": { label: "Beer Consumption", shortLabel: "Beer / Person", clarifier: "liters per year" },
  "coffee-consumption-per-capita": { label: "Coffee Consumption", shortLabel: "Coffee / Person", clarifier: "kg per year" },
  "wine-consumption-per-capita": { label: "Wine Consumption", shortLabel: "Wine / Person", clarifier: "liters per year" },
  "education-spending-pct": { label: "Education Spending", shortLabel: "Education % GDP", clarifier: "% of GDP" },
  "health-spending-pct": { label: "Health Spending", shortLabel: "Health % GDP", clarifier: "% of GDP" },
  "arable-land-pct": { label: "Arable Land", shortLabel: "Farmland %", clarifier: "% of land arable" },
  "fdi-inflow": { label: "Foreign Direct Investment", shortLabel: "Foreign Investment", clarifier: "USD inflow/year" },
};

let changed = 0;
const missing: string[] = [];
for (const cat of cats) {
  const u = updates[cat.slug];
  if (!u) {
    missing.push(cat.slug);
    continue;
  }
  if (u.label) cat.label = u.label;
  cat.shortLabel = u.shortLabel;
  cat.clarifier = u.clarifier;
  changed++;
}

fs.writeFileSync(file, JSON.stringify(cats, null, 2) + "\n");
console.log(`Updated ${changed}/${cats.length} categories.`);
if (missing.length) console.log(`No mapping (left as-is): ${missing.join(", ")}`);
