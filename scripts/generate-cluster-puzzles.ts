/**
 * Stopgap Cluster puzzle generator — buys ~90 days of runway so the daily never
 * hits the "no puzzle" wall while the proper synthesizer (varied templates +
 * planted traps) is built later.
 *
 * Safe by construction: every group is "Countries in {subregion}", and each
 * country belongs to exactly one subregion, so the 16 are always disjoint and
 * unambiguous. Difficulty tiers run largest→smallest subregion (more familiar →
 * more obscure). Existing curated files are never overwritten.
 *
 * Run: npx tsx scripts/generate-cluster-puzzles.ts
 */
import fs from "node:fs";
import path from "node:path";

interface Country { iso3: string; subregion?: string }

const DIR = path.join(process.cwd(), "content/cluster");
const countries: Country[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/countries.json"), "utf8"),
);

const bySub: Record<string, string[]> = {};
for (const c of countries) {
  if (!c.subregion) continue;
  (bySub[c.subregion] ||= []).push(c.iso3);
}
const subregions = Object.keys(bySub).filter((s) => bySub[s].length >= 4);

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const existing = new Set(
  fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")),
);
const maxDate = [...existing].sort().pop();
if (!maxDate) throw new Error("no existing cluster files to extend from");

const DIFFS = ["easy", "medium", "hard", "purple"] as const;
const usedCombos = new Set<string>();
let written = 0;
let offset = 1;
let lastDate = maxDate;

while (written < 90 && offset < 400) {
  const date = addDays(maxDate, offset);
  offset++;
  if (existing.has(date)) continue;

  const rng = mulberry32(hashStr("cluster-stopgap-" + date));
  let chosen: string[] = [];
  for (let tries = 0; tries < 60; tries++) {
    chosen = shuffle(subregions, rng).slice(0, 4);
    const key = [...chosen].sort().join("|");
    if (!usedCombos.has(key)) { usedCombos.add(key); break; }
  }

  // largest subregion → easy, smallest → purple
  const ordered = [...chosen].sort((a, b) => bySub[b].length - bySub[a].length);
  const groups = ordered.map((sub, i) => ({
    theme: `Countries in ${sub}`,
    difficulty: DIFFS[i],
    countryIso3s: shuffle(bySub[sub], rng).slice(0, 4),
  }));

  const puzzle = { date, groups, editorial: "Sort all sixteen flags into their world subregion." };
  fs.writeFileSync(path.join(DIR, `${date}.json`), JSON.stringify(puzzle, null, 2) + "\n");
  written++;
  lastDate = date;
}

console.log(`Wrote ${written} cluster puzzles, ${addDays(maxDate, 1)} .. ${lastDate} (skipped existing).`);
