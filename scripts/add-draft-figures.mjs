// Applies a tracked list of Country Draft additions to src/data/figures.json.
// New people are appended after every existing entry, so authored order and the legacy
// standing of everyone already in the roster stay as they were. Existing people only gain
// the optional `wiki` and `portraitFile` fields; their authored name, category and note are
// never rewritten here.
// Run: node scripts/add-draft-figures.mjs [scripts/data/draft-additions-2026-11.mjs]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const listPath = resolve(process.argv[2] ?? "scripts/data/draft-additions-2026-11.mjs");
const { ADDITIONS } = await import(pathToFileURL(listPath).href);
const target = new URL("../src/data/figures.json", import.meta.url);
const roster = JSON.parse(readFileSync(target, "utf8"));
const countries = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const sovereign = new Set(JSON.parse(readFileSync(new URL("../src/data/sovereign.json", import.meta.url), "utf8")));
const slugOf = (name) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u;
// System copy rules: no em or en dashes and no exclamation marks.
const FORBIDDEN = /[–—!]/;
const CUTOFF_BIRTH_YEAR = 2008;
const categories = new Set(roster.categories.map((c) => c.id));
const known = new Set(countries.map((c) => c.iso3));
const bySlug = new Map(roster.figures.map((f) => [slugOf(f.name), f]));

if (!Array.isArray(ADDITIONS) || !ADDITIONS.length) throw new Error(`${listPath} exports no ADDITIONS`);
const seen = new Set();
let added = 0, updated = 0;
for (const entry of ADDITIONS) {
  const slug = slugOf(entry.name ?? "");
  if (!slug) throw new Error(`addition without a name: ${JSON.stringify(entry)}`);
  if (seen.has(slug)) throw new Error(`listed twice: ${entry.name}`);
  seen.add(slug);
  if (!known.has(entry.iso3) || !sovereign.has(entry.iso3)) throw new Error(`${entry.name}: ${entry.iso3} is not a sovereign country`);
  if (!Number.isInteger(entry.born) || entry.born > CUTOFF_BIRTH_YEAR) throw new Error(`${entry.name}: birth year must be ${CUTOFF_BIRTH_YEAR} or earlier`);
  if (entry.wiki !== undefined && (typeof entry.wiki !== "string" || !entry.wiki.trim())) throw new Error(`${entry.name}: empty wiki title`);
  if (entry.portraitFile !== undefined && (typeof entry.portraitFile !== "string" || /^File:|\//.test(entry.portraitFile))) throw new Error(`${entry.name}: portraitFile is a bare Commons file name`);
  const existing = bySlug.get(slug);
  if (existing) {
    if (existing.iso3 !== entry.iso3) throw new Error(`${entry.name} already belongs to ${existing.iso3}`);
    if (entry.category && entry.category !== existing.category) throw new Error(`${entry.name} is authored as ${existing.category}`);
    let changed = false;
    for (const key of ["wiki", "portraitFile"]) {
      if (entry[key] === undefined || existing[key] === entry[key]) continue;
      existing[key] = entry[key];
      changed = true;
    }
    if (changed) updated += 1;
    continue;
  }
  if (!categories.has(entry.category)) throw new Error(`${entry.name}: unknown category ${entry.category}`);
  if (entry.era !== "modern" && entry.era !== "historical") throw new Error(`${entry.name}: era must be modern or historical`);
  if (typeof entry.note !== "string" || !entry.note) throw new Error(`${entry.name}: a new person needs a note`);
  if (entry.name.length > 28) throw new Error(`name too long: ${entry.name}`);
  if (entry.note.length > 52) throw new Error(`note too long on ${entry.name}`);
  if (EMOJI.test(entry.name) || EMOJI.test(entry.note) || FORBIDDEN.test(entry.name) || FORBIDDEN.test(entry.note)) throw new Error(`forbidden character on ${entry.name}`);
  const figure = { name: entry.name, iso3: entry.iso3, category: entry.category, era: entry.era, note: entry.note };
  if (entry.wiki) figure.wiki = entry.wiki;
  if (entry.portraitFile) figure.portraitFile = entry.portraitFile;
  roster.figures.push(figure);
  bySlug.set(slug, figure);
  added += 1;
}
writeFileSync(target, JSON.stringify(roster, null, 2) + "\n");
console.log(`figures.json: ${added} people added, ${updated} existing people given a lookup title or pinned portrait, ${roster.figures.length} in total.`);
