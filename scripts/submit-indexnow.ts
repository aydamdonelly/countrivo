/**
 * Submit all Countrivo URLs to IndexNow (Bing, DuckDuckGo, Yahoo, Ecosia).
 *
 * Usage:  npx tsx scripts/submit-indexnow.ts
 */

const API_KEY = "f9505761df0dc045e453ea76165d13b0";
const HOST = "countrivo.com";
const BASE = `https://${HOST}`;
const KEY_LOCATION = `${BASE}/${API_KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

// --------------- collect URLs ---------------

import countriesData from "../src/data/countries.json";
import categoriesData from "../src/data/categories.json";
import gamesData from "../src/data/game-registry.json";

type CountryEntry = { slug: string };
type CategoryEntry = { slug: string };
type GameEntry = { route: string };

const countries = countriesData as CountryEntry[];
const categories = categoriesData as CategoryEntry[];
const games = gamesData as GameEntry[];

const listSlugs = [
  "largest-countries",
  "most-populated-countries",
  "richest-countries",
  "countries-in-europe",
  "countries-in-asia",
  "countries-in-africa",
  "countries-in-americas",
  "most-visited-countries",
  "highest-life-expectancy",
  "highest-gdp-countries",
  "most-forested-countries",
  "most-connected-countries",
  "highest-fertility-rate",
  "biggest-military-spenders",
  "greenest-countries",
];

const urls: string[] = [
  BASE,
  `${BASE}/games`,
  `${BASE}/countries`,
  `${BASE}/categories`,
  `${BASE}/lists`,
  ...listSlugs.map((s) => `${BASE}/lists/${s}`),
  ...games.map((g) => `${BASE}${g.route}`),
  ...countries.map((c) => `${BASE}/countries/${c.slug}`),
  ...categories.map((c) => `${BASE}/categories/${c.slug}`),
];

// --------------- submit in batches ---------------

async function submit(batch: string[]): Promise<number> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: API_KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
    }),
  });
  return res.status;
}

async function main() {
  console.log(`IndexNow: submitting ${urls.length} URLs to Bing / DuckDuckGo / Yahoo / Ecosia\n`);

  const BATCH_SIZE = 10_000; // IndexNow max per request
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const status = await submit(batch);
    const ok = status === 200 || status === 202;
    console.log(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} URLs → ${status} ${ok ? "✓" : "✗"}`
    );
    if (!ok) {
      console.error(`  ⚠ Unexpected status ${status}. Check key file at ${KEY_LOCATION}`);
    }
  }

  console.log("\nDone. Search engines will crawl these URLs with higher priority.");
}

main().catch(console.error);
