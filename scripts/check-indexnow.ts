/** Offline checks: npx tsx scripts/check-indexnow.ts */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import countries from "../src/data/countries.json";
import categories from "../src/data/categories.json";
import games from "../src/data/game-registry.json";
import timestamps from "../src/data/data-timestamps.json";
import submitted from "./.indexnow-snapshot.json";
import { LIST_SLUGS } from "../src/content/lists";
import rootSitemap, { BASE_URL } from "../src/app/sitemap";
import gameSitemap from "../src/app/(seo)/games/sitemap";
import countrySitemap from "../src/app/(seo)/countries/sitemap";
import listSitemap from "../src/app/(seo)/lists/sitemap";
import { acceptedIndexNowSnapshot, buildIndexNowStamps, changedIndexNowUrls } from "../src/lib/seo/indexnow";

const inventory = { countries, categories, games, listSlugs: LIST_SLUGS };
const current = buildIndexNowStamps(timestamps, inventory, BASE_URL);
const sitemapStamps = Object.fromEntries(
  [...rootSitemap(), ...gameSitemap(), ...countrySitemap(), ...listSitemap()].map((page) => {
    assert.ok(page.lastModified, `${page.url} has a sitemap date`);
    return [page.url, new Date(page.lastModified).toISOString()];
  }),
);
assert.deepEqual(current, sitemapStamps, "Every IndexNow URL/date matches the actual sitemaps");

const geoUrl = `${BASE_URL}/games/geo-wordle`;
assert.equal(current[geoUrl], timestamps.entries["game:geo-wordle"].lastModified);
assert.ok(!Object.keys(current).some((url) => /\/(country|category|game|list):/.test(url)));
const previous = { ...current, [geoUrl]: "2000-01-01T00:00:00.000Z" };
assert.deepEqual(changedIndexNowUrls(current, previous), [geoUrl], "An existing game's update is submitted");
assert.deepEqual(changedIndexNowUrls(current, current), [], "Unchanged URLs are skipped");
assert.equal(changedIndexNowUrls(current, submitted).includes(geoUrl), current[geoUrl] !== submitted[geoUrl]);

const noDates = buildIndexNowStamps({ generatedAt: "2026-09-04T00:00:00.000Z", entries: {} }, inventory, BASE_URL);
assert.ok(Object.values(noDates).every((stamp) => stamp === "2026-09-04T00:00:00.000Z"));
const dated = buildIndexNowStamps({
  generatedAt: "2026-09-04T00:00:00.000Z",
  entries: {
    "game:geo-wordle": { lastModified: "2026-08-02T00:00:00.000Z" },
    "country:japan": { lastModified: "2026-08-01T00:00:00.000Z" },
    "category:population": { lastModified: "2026-08-03T00:00:00.000Z" },
    "list:largest-countries": { lastModified: "2026-08-04T00:00:00.000Z" },
  },
}, inventory, BASE_URL);
assert.equal(dated[BASE_URL], "2026-08-02T00:00:00.000Z", "Home follows games/countries, not generatedAt");
assert.equal(dated[`${BASE_URL}/games`], "2026-08-02T00:00:00.000Z");
assert.equal(dated[`${BASE_URL}/countries`], "2026-08-01T00:00:00.000Z");
assert.equal(dated[`${BASE_URL}/categories`], "2026-08-03T00:00:00.000Z");
assert.equal(dated[`${BASE_URL}/lists`], "2026-08-04T00:00:00.000Z");
assert.deepEqual(acceptedIndexNowSnapshot(previous, current, []), previous, "Failed batches retain old stamps");
assert.deepEqual(acceptedIndexNowSnapshot(previous, current, [geoUrl]), current, "Only accepted URLs advance");

const repo = resolve(__dirname, "..");
const fixture = mkdtempSync(resolve(tmpdir(), "countrivo-indexnow-"));
try {
  mkdirSync(resolve(fixture, "scripts"));
  writeFileSync(resolve(fixture, "package.json"), "{}");
  const guard = resolve(fixture, "block-network.cjs");
  writeFileSync(guard, 'globalThis.fetch = async () => { throw new Error("Network access forbidden in this check"); };');
  const snapshotPath = resolve(fixture, "scripts/.indexnow-snapshot.json");
  const run = (args: string[]) => spawnSync(process.execPath, [
    "--require", guard,
    "--import", pathToFileURL(resolve(repo, "node_modules/tsx/dist/loader.mjs")).href,
    resolve(repo, "scripts/submit-indexnow.ts"), ...args,
  ], { cwd: fixture, encoding: "utf8", timeout: 30_000 });

  writeFileSync(snapshotPath, JSON.stringify(previous));
  const original = readFileSync(snapshotPath, "utf8");
  const modified = statSync(snapshotPath).mtimeMs;
  const dryRun = run(["--dry-run"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.ok(dryRun.stdout.includes("dry run"));
  assert.ok(dryRun.stdout.includes(`${geoUrl}\t${current[geoUrl]}`));
  assert.equal(readFileSync(snapshotPath, "utf8"), original);
  assert.equal(statSync(snapshotPath).mtimeMs, modified, "Dry run does not write the snapshot");

  writeFileSync(snapshotPath, JSON.stringify(current));
  const unchangedModified = statSync(snapshotPath).mtimeMs;
  const unchanged = run([]);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  assert.ok(unchanged.stdout.includes("nothing changed"));
  assert.equal(statSync(snapshotPath).mtimeMs, unchangedModified, "Unchanged run neither submits nor writes");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
console.log(`IndexNow checks passed: ${Object.keys(current).length} sitemap URLs, real timestamp mapping, hub dates, accepted-only snapshots, and offline dry-run/unchanged execution.`);
