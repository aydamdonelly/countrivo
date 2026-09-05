/**
 * Builds src/data/data-timestamps.json: a per-page content fingerprint and the
 * date that content last actually changed.
 *
 * Google only honours <lastmod> when it is "consistently and verifiably
 * accurate". Stamping new Date() on every URL at build time is the exact
 * pattern that makes Google discard it, so instead we hash the data behind
 * each page and only move the date when the hash moves.
 *
 * Re-run after data, game copy or metadata changes:
 *   npx tsx scripts/build-data-timestamps.ts
 *
 * `--rebaseline` re-fingerprints the data WITHOUT moving a single date. Use it
 * after a change that alters the JSON but not what any page renders, so the dates
 * stay verifiable: the rebuild's emoji strip (the `emoji` / `flagEmoji` keys the UI
 * no longer reads) moved 281 of 297 fingerprints, and a plain run would stamp all
 * 281 URLs with the same day, which is exactly the unverifiable lastmod this file
 * exists to prevent. Run it once after such a change, never as routine.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { LISTS } from "../src/content/lists";
import { ENTITY_COPY } from "../src/content/entity";
import { getGameContent } from "../src/content/games";
import { getGameCopy } from "../src/lib/seo/game-copy";
import { getGameSeo } from "../src/lib/seo/game-metadata";

const REBASELINE = process.argv.includes("--rebaseline");

const REPO_ROOT = join(__dirname, "..");
const DATA_DIR = join(__dirname, "../src/data");
const OUTPUT_PATH = join(DATA_DIR, "data-timestamps.json");

interface CountryRecord {
  iso3: string;
  slug: string;
  [key: string]: unknown;
}

interface CategoryRecord {
  slug: string;
  [key: string]: unknown;
}

interface GameRecord {
  slug: string;
  [key: string]: unknown;
}

interface TimestampEntry {
  hash: string;
  lastModified: string;
}

interface TimestampFile {
  generatedAt: string;
  entries: Record<string, TimestampEntry>;
}

type StatTable = Record<string, Record<string, number | null>>;
type RankTable = Record<string, Record<string, number>>;

// Each list page is a deterministic view over stats.json, so its fingerprint
// is the slice of data it actually renders, not the whole dataset.
type ListSource =
  | { kind: "stat"; stat: string; limit: number }
  | { kind: "continent"; continent: string; stats: string[] };

/** A stat list renders the top 50 of one category (blueprint 7.13, "The ranking"). */
const statList = (stat: string): ListSource => ({ kind: "stat", stat, limit: 50 });

/** A continent list renders every country of the continent with population and area. */
const continentList = (continent: string): ListSource => ({
  kind: "continent",
  continent,
  stats: ["population", "area-km2"],
});

/**
 * The 15 list pages, keyed by slug, derived from src/content/lists.ts: the one source
 * the hub, the 15 pages and lists/sitemap.ts read too (blueprint 7.12). A list added
 * there gets a fingerprint here on the next run with no second edit, and no slug can
 * drift between the sitemap and the timestamps.
 *
 * The two helpers above are the mapping rule: a stat list is fingerprinted by the top
 * 50 rows it prints, a continent list by every country it prints with the two values
 * its table shows.
 */
const LIST_SOURCES: Record<string, ListSource> = Object.fromEntries(
  LISTS.map((list) => [
    list.slug,
    list.source.kind === "stat"
      ? statList(list.source.category)
      : continentList(list.source.continent),
  ])
);

// --------------- load ---------------

const countries: CountryRecord[] = JSON.parse(
  readFileSync(join(DATA_DIR, "countries.json"), "utf-8")
);

const categories: CategoryRecord[] = JSON.parse(
  readFileSync(join(DATA_DIR, "categories.json"), "utf-8")
);

const games: GameRecord[] = JSON.parse(
  readFileSync(join(DATA_DIR, "game-registry.json"), "utf-8")
);

const stats: StatTable = JSON.parse(readFileSync(join(DATA_DIR, "stats.json"), "utf-8"));
const ranks: RankTable = JSON.parse(readFileSync(join(DATA_DIR, "ranks.json"), "utf-8"));

// --------------- hashing ---------------

/** JSON.stringify with object keys sorted at every depth, so key order in the
 *  source JSON can never move a hash. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function hash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16);
}

/** Top-N iso3 codes for a stat, ranked highest value first: mirrors
 *  getTopCountries() so the fingerprint tracks what the page renders. */
function topForStat(stat: string, limit: number): { iso3: string; value: number }[] {
  const entries: { iso3: string; value: number }[] = [];
  for (const [iso3, countryStats] of Object.entries(stats)) {
    const value = countryStats[stat];
    if (value !== undefined && value !== null) {
      entries.push({ iso3, value });
    }
  }
  entries.sort((a, b) => b.value - a.value || a.iso3.localeCompare(b.iso3));
  return entries.slice(0, limit);
}

// --------------- build fingerprints ---------------

const hashes: Record<string, string> = {};

for (const country of countries) {
  hashes[`country:${country.slug}`] = hash({
    country,
    stats: stats[country.iso3] ?? null,
    ranks: ranks[country.iso3] ?? null,
  });
}

for (const category of categories) {
  hashes[`category:${category.slug}`] = hash({
    category,
    // The category page ranks every country on this one stat.
    values: Object.entries(stats)
      .map(([iso3, countryStats]) => ({ iso3, value: countryStats[category.slug] ?? null }))
      .sort((a, b) => a.iso3.localeCompare(b.iso3)),
  });
}

for (const [slug, source] of Object.entries(LIST_SOURCES)) {
  if (source.kind === "stat") {
    hashes[`list:${slug}`] = hash(topForStat(source.stat, source.limit));
  } else {
    const rows = countries
      .filter((country) => country.continent === source.continent)
      .map((country) => ({
        iso3: country.iso3,
        name: country.name,
        slug: country.slug,
        values: source.stats.map((stat) => stats[country.iso3]?.[stat] ?? null),
      }))
      .sort((a, b) => a.iso3.localeCompare(b.iso3));
    hashes[`list:${slug}`] = hash(rows);
  }
}

for (const game of games) {
  hashes[`game:${game.slug}`] = hash({
    game,
    content: getGameContent(game.slug),
    copy: getGameCopy(game.slug),
    metadata: getGameSeo(game.slug),
    entity: ENTITY_COPY[game.slug] ?? null,
    ...(game.slug === "geo-wordle"
      ? { guide: readFileSync(join(REPO_ROOT, "src/features/seo/geo-wordle-guide.tsx"), "utf8") }
      : {}),
  });
}

// --------------- merge with previous run ---------------

let previous: Record<string, TimestampEntry> = {};
if (existsSync(OUTPUT_PATH)) {
  const parsed: TimestampFile = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
  previous = parsed.entries ?? {};
}

const now = new Date().toISOString();

/**
 * Seed date for a key seen for the FIRST time.
 *
 * A first run has no previous hash to compare against, so every key looks
 * "changed" and would be stamped `now`, which republishes the very bug this
 * script exists to kill: 301 URLs all claiming they changed today. The honest
 * answer for data that has not been touched since it was committed is the
 * commit date of the file it comes from. Only a hash that moves on a LATER run
 * is a real edit and earns `now`.
 */
const gitDateCache = new Map<string, string>();
function sourceCommitDate(relPath: string): string {
  const cached = gitDateCache.get(relPath);
  if (cached) return cached;
  let iso = now;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", relPath], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    }).trim();
    if (out) iso = new Date(out).toISOString();
  } catch {
    // Not a git checkout (or the file is untracked): fall back to now.
  }
  gitDateCache.set(relPath, iso);
  return iso;
}

/** Which source file each key namespace derives from. */
function seedDateFor(key: string): string {
  if (key.startsWith("game:")) return sourceCommitDate("src/data/game-registry.json");
  if (key.startsWith("category:")) return sourceCommitDate("src/data/categories.json");
  // country: and list: are both driven by the stats/ranks pipeline; take the
  // newest of the three inputs so the claim is never older than the data.
  const candidates = [
    sourceCommitDate("src/data/countries.json"),
    sourceCommitDate("src/data/stats.json"),
    sourceCommitDate("src/data/ranks.json"),
  ];
  return candidates.reduce((a, b) => (a > b ? a : b));
}

const entries: Record<string, TimestampEntry> = {};

let unchanged = 0;
let changed = 0;
let added = 0;

for (const key of Object.keys(hashes).sort()) {
  const prev = previous[key];
  if (prev && prev.hash === hashes[key]) {
    entries[key] = { hash: prev.hash, lastModified: prev.lastModified };
    unchanged++;
  } else if (prev) {
    // --rebaseline: take the new fingerprint, keep the date the page already claims.
    entries[key] = { hash: hashes[key], lastModified: REBASELINE ? prev.lastModified : now };
    changed++;
  } else {
    entries[key] = { hash: hashes[key], lastModified: seedDateFor(key) };
    added++;
  }
}

const removed = Object.keys(previous).filter((key) => !(key in hashes));

const output: TimestampFile = { generatedAt: now, entries };
writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(
  `data-timestamps.json: ${Object.keys(entries).length} keys ` +
    `(${added} new, ${changed} ${REBASELINE ? "re-fingerprinted, dates kept" : "changed"}, ` +
    `${unchanged} unchanged, ${removed.length} dropped)`
);
if (removed.length > 0) {
  console.log(`  dropped: ${removed.join(", ")}`);
}
