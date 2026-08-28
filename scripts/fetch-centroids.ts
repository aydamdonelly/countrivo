/**
 * Generates src/data/centroids.json — { [iso3]: [lat, lng] } for every country
 * in countries.json. Source: gavinr/world-countries-centroids (CC0, ISO2-keyed).
 * Used by the geo-wordle game (great-circle distance + bearing on each guess).
 *
 * Run: npx tsx scripts/fetch-centroids.ts
 * Data rule: never hand-edit JSON in src/data — regenerate with this script.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface Country { iso2: string; iso3: string; displayName: string }

const ROOT = process.cwd();
const countries = JSON.parse(
  readFileSync(resolve(ROOT, "src/data/countries.json"), "utf8"),
) as Country[];

async function main() {
  const url =
    "https://raw.githubusercontent.com/gavinr/world-countries-centroids/master/dist/countries.csv";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`centroids CSV ${res.status}`);
  const csv = await res.text();

  // Columns: longitude,latitude,COUNTRY,ISO(iso2),COUNTRYAFF,AFF_ISO
  // The lazy `.*?` skips a (possibly comma-containing) country name to the first
  // 2-letter ISO code.
  const byIso2 = new Map<string, [number, number]>();
  for (const line of csv.split("\n").slice(1)) {
    const m = line.match(/^(-?[\d.]+),(-?[\d.]+),.*?,([A-Za-z]{2}),/);
    if (!m) continue;
    const lng = Number(m[1]);
    const lat = Number(m[2]);
    if (!isFinite(lat) || !isFinite(lng)) continue;
    byIso2.set(m[3].toUpperCase(), [Number(lat.toFixed(3)), Number(lng.toFixed(3))]);
  }

  const out: Record<string, [number, number]> = {};
  for (const c of countries) {
    const ll = byIso2.get((c.iso2 || "").toUpperCase());
    if (ll) out[c.iso3] = ll;
  }

  const missing = countries.map((c) => c.iso3).filter((iso) => !(iso in out));
  if (missing.length) {
    console.warn(`⚠️  ${missing.length} missing centroids:`, missing.slice(0, 40).join(", "));
  }

  const sorted: Record<string, [number, number]> = {};
  for (const k of Object.keys(out).sort()) sorted[k] = out[k];

  writeFileSync(resolve(ROOT, "src/data/centroids.json"), JSON.stringify(sorted) + "\n");
  console.log(`✅ Wrote centroids for ${Object.keys(sorted).length}/${countries.length} countries.`);
}

main().catch((e) => {
  console.error("centroid fetch failed:", e);
  process.exit(1);
});
