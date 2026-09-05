/**
 * Submit new or changed sitemap URLs to IndexNow's shared participant endpoint.
 * Google does not participate. Acceptance confirms receipt, not indexing.
 * Only accepted batches advance scripts/.indexnow-snapshot.json.
 *
 * Usage: npx tsx scripts/submit-indexnow.ts [--dry-run]
 * Dry runs print changed URLs without making requests or writing the snapshot.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import countries from "../src/data/countries.json";
import categories from "../src/data/categories.json";
import games from "../src/data/game-registry.json";
import timestamps from "../src/data/data-timestamps.json";
import { LIST_SLUGS } from "../src/content/lists";
import {
  acceptedIndexNowSnapshot,
  buildIndexNowStamps,
  changedIndexNowUrls,
  type UrlStamps,
} from "../src/lib/seo/indexnow";

const API_KEY = "f9505761df0dc045e453ea76165d13b0";
const HOST = "countrivo.com";
const BASE = `https://${HOST}`;
const KEY_LOCATION = `${BASE}/${API_KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;

function findRepoRoot(): string {
  let dir = process.cwd();
  while (!existsSync(resolve(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Run IndexNow from the repository.");
    dir = parent;
  }
  return dir;
}

function readSnapshot(path: string): UrlStamps {
  if (!existsSync(path)) return {};
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid IndexNow snapshot: expected an object.");
  }
  const snapshot: UrlStamps = {};
  for (const [url, stamp] of Object.entries(parsed)) {
    if (typeof stamp !== "string") throw new Error(`Invalid IndexNow stamp for ${url}.`);
    snapshot[url] = stamp;
  }
  return snapshot;
}

function describeStatus(status: number): string {
  switch (status) {
    case 200: return "200 OK: URLs received";
    case 202: return "202 Accepted: key validation pending";
    case 400: return "400 Bad Request: malformed payload";
    case 403: return `403 Forbidden: verify ${KEY_LOCATION}`;
    case 422: return `422 Unprocessable: URL or key does not match ${HOST}`;
    case 429: return "429 Too Many Requests: throttled, retry on a later run";
    default: return `${status}: unexpected IndexNow response`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) throw new Error("Usage: submit-indexnow.ts [--dry-run]");
  const dryRun = args.includes("--dry-run");
  const snapshotPath = resolve(findRepoRoot(), "scripts/.indexnow-snapshot.json");
  const snapshot = readSnapshot(snapshotPath);
  const resolved = buildIndexNowStamps(timestamps, { countries, categories, games, listSlugs: LIST_SLUGS }, BASE);
  const changed = changedIndexNowUrls(resolved, snapshot);

  if (changed.length === 0) {
    console.log(`IndexNow: nothing changed across ${Object.keys(resolved).length} URLs; skipping submission.`);
    return;
  }
  console.log(`IndexNow${dryRun ? " dry run" : ""}: ${changed.length} of ${Object.keys(resolved).length} URLs changed.`);
  if (dryRun) {
    for (const url of changed) console.log(`${url}\t${resolved[url]}`);
    console.log("No requests made; snapshot unchanged.");
    return;
  }

  const accepted: string[] = [];
  let failed = false;
  for (let offset = 0; offset < changed.length; offset += BATCH_SIZE) {
    const batch = changed.slice(offset, offset + BATCH_SIZE);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: HOST, key: API_KEY, keyLocation: KEY_LOCATION, urlList: batch }),
        signal: AbortSignal.timeout(30_000),
      });
      console.log(`Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batch.length} URLs; ${describeStatus(response.status)}`);
      if (response.status === 200 || response.status === 202) accepted.push(...batch);
      else failed = true;
    } catch (error: unknown) {
      console.error(`Batch ${Math.floor(offset / BATCH_SIZE) + 1} failed:`, error);
      failed = true;
    }
  }

  if (accepted.length > 0) {
    const next = acceptedIndexNowSnapshot(snapshot, resolved, accepted);
    writeFileSync(snapshotPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(`Snapshot updated for ${accepted.length} accepted URLs.`);
  }
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("IndexNow submission failed:", error);
  process.exitCode = 1;
});
