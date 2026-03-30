/**
 * Reads stats.json and categories.json, computes ranks for each category.
 * Outputs ranks.json where ranks[iso3][categorySlug] = rank (1 = highest value).
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "../src/data");

interface Category {
  slug: string;
  label: string;
  direction: string;
}

const stats: Record<string, Record<string, number>> = JSON.parse(
  readFileSync(join(DATA_DIR, "stats.json"), "utf-8")
);

const categories: Category[] = JSON.parse(
  readFileSync(join(DATA_DIR, "categories.json"), "utf-8")
);

const ranks: Record<string, Record<string, number>> = {};

// Initialize ranks for all countries
for (const iso3 of Object.keys(stats)) {
  ranks[iso3] = {};
}

for (const category of categories) {
  const { slug } = category;

  // Collect all countries that have this stat
  const entries: { iso3: string; value: number }[] = [];
  for (const [iso3, countryStats] of Object.entries(stats)) {
    if (countryStats[slug] !== undefined && countryStats[slug] !== null) {
      entries.push({ iso3, value: countryStats[slug] });
    }
  }

  // Sort descending by value (rank 1 = highest value)
  entries.sort((a, b) => b.value - a.value);

  // Assign ranks (handle ties by giving same rank)
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value < entries[i - 1].value) {
      currentRank = i + 1;
    }
    ranks[entries[i].iso3][slug] = currentRank;
  }

  console.log(`${slug}: ${entries.length} countries ranked`);
}

writeFileSync(join(DATA_DIR, "ranks.json"), JSON.stringify(ranks, null, 2));

// Report
const countriesWithRanks = Object.keys(ranks).length;
const avgCategories =
  Object.values(ranks).reduce((sum, r) => sum + Object.keys(r).length, 0) / countriesWithRanks;
console.log(`\nranks.json written: ${countriesWithRanks} countries, avg ${avgCategories.toFixed(1)} categories per country`);
