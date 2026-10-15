// Builds the portrait-backed Country Draft pool. Complete biographies and career records
// are checked again by the runtime roster before a person can be dealt.
// Run: node scripts/build-draft-pool.mjs
import { writeFileSync, readFileSync, existsSync } from "node:fs";

// Stamped into every payload and compared by the server validator. Bump it in the same
// commit as any roster change; the build refuses to write a changed pool under an
// unchanged version, so this cannot drift by accident.
const POOL_VERSION = 3;

const CAP = 32;              // bounded future growth; retains every currently credited portrait in eligible countries
const MIN_ARCHETYPES = 3;    // a round needs three different archetypes from one country

/** The 8 archetypes, in fit-table order. Every authored category maps to exactly one. */
const ARCHETYPES = ["sovereign", "commander", "financier", "performer", "builder", "firebrand", "contender", "outlaw"];
const OF_CATEGORY = {
  leaders: "sovereign",
  autocrats: "sovereign",
  commanders: "commander",
  founders: "financier",
  musicians: "performer",
  screen: "performer",
  comedians: "performer",
  broadcasters: "performer",
  scientists: "builder",
  writers: "firebrand",
  athletes: "contender",
  outlaws: "outlaw",
};

const src = new URL("../src/data/figures.json", import.meta.url);
const roster = JSON.parse(readFileSync(src, "utf8"));
const countries = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const sovereign = new Set(JSON.parse(readFileSync(new URL("../src/data/sovereign.json", import.meta.url), "utf8")));
const portraits = new Set(JSON.parse(readFileSync(new URL("../src/data/portrait-slugs.json", import.meta.url), "utf8")));
const credits = JSON.parse(readFileSync(new URL("../src/data/figure-credits.json", import.meta.url), "utf8"));
const slugOf = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const byIso = new Map(countries.map((c) => [c.iso3, c]));

const authored = new Set(roster.categories.map((c) => c.id));
for (const id of authored) if (!OF_CATEGORY[id]) throw new Error(`category ${id} has no archetype`);
for (const id of Object.keys(OF_CATEGORY)) if (!authored.has(id)) throw new Error(`archetype map names unknown category ${id}`);

const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u;

// Keep the authored order, selecting usable portraits before the per-archetype cap.
// Standing remains a bounded legacy field; current scores use individual career records.
const bench = new Map();  // iso3 -> archetype -> people[]
const usedNames = new Set();
for (const [order, f] of roster.figures.entries()) {
  if (!byIso.has(f.iso3)) throw new Error(`unknown iso3 ${f.iso3} on ${f.name}`);
  if (EMOJI.test(f.name) || EMOJI.test(f.note)) throw new Error(`emoji in the roster: ${f.name}`);
  if (f.name.length > 28) throw new Error(`name too long: ${f.name}`);
  if (f.note.length > 52) throw new Error(`note too long on ${f.name}`);
  if (!sovereign.has(f.iso3)) continue;
  const slug = slugOf(f.name);
  const credit = credits[slug];
  if (!portraits.has(slug) || !existsSync(new URL(`../public/figures/${slug}.jpg`, import.meta.url)) || !credit?.licence || !credit.author || !credit.url) continue;
  if (usedNames.has(slug)) throw new Error(`duplicate person in roster: ${f.name}`);
  usedNames.add(slug);
  const archetype = OF_CATEGORY[f.category];
  if (!bench.has(f.iso3)) bench.set(f.iso3, new Map());
  const byArch = bench.get(f.iso3);
  if (!byArch.has(archetype)) byArch.set(archetype, []);
  byArch.get(archetype).push({ name: f.name, note: f.note, order });
}
const kept = new Map();
for (const [iso3, byArch] of bench) {
  const out = new Map();
  for (const [archetype, list] of byArch) {
    list.sort((a, b) => a.order - b.order);
    out.set(archetype, list.slice(0, CAP).map((p, i) => ({ name: p.name, note: p.note, standing: Math.max(1, 5 - i) })));
  }
  kept.set(iso3, out);
}

const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
const out = [];
for (const [iso3, byArch] of [...kept].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  if (byArch.size < MIN_ARCHETYPES) continue;
  // Individual careers now determine fit and fame, so equal legacy standings do not make a country unplayable.
  const arches = [...byArch.keys()].sort((a, b) => ARCHETYPES.indexOf(a) - ARCHETYPES.indexOf(b));
  const country = byIso.get(iso3);
  const t = CONTINENTS.indexOf(country.continent);
  if (t < 0) throw new Error(`unknown continent ${country.continent} for ${iso3}`);
  out.push({
    c: iso3,
    i: country.iso2.toLowerCase(),
    n: country.displayName,
    r: country.subregion && country.subregion !== country.region ? `${country.region} · ${country.subregion}` : country.region,
    t,
    g: arches.map((a) => [ARCHETYPES.indexOf(a), byArch.get(a).map((p) => [p.name, p.standing, p.note])]),
  });
}

const json = { v: POOL_VERSION, a: ARCHETYPES, t: CONTINENTS, p: out };
const s = JSON.stringify(json);

const target = new URL("../src/data/draft-pool.json", import.meta.url);
if (existsSync(target)) {
  const previous = JSON.parse(readFileSync(target, "utf8"));
  const changed = JSON.stringify({ a: previous.a, t: previous.t, p: previous.p }) !== JSON.stringify({ a: ARCHETYPES, t: CONTINENTS, p: out });
  if (changed && previous.v === POOL_VERSION) {
    throw new Error(
      `the pool changed but POOL_VERSION is still ${POOL_VERSION}. Bump it here and in the same commit, ` +
        "and deploy right after 00:00 Europe/Berlin so no daily board changes under a player.",
    );
  }
}
const total = out.reduce((n, c) => n + c.g.reduce((m, g) => m + g[1].length, 0), 0);
const conts = new Set(out.map((c) => byIso.get(c.c).continent));
if (out.length < 40) throw new Error(`only ${out.length} playable countries`);
if (conts.size < 4) throw new Error(`only ${conts.size} continents`);
if (s.length > 96 * 1024) throw new Error(`draft-pool.json is ${s.length} bytes`);
writeFileSync(target, s + "\n");
console.log(`wrote src/data/draft-pool.json ${s.length} bytes: ${out.length} countries, ${total} people, ${conts.size} continents`);
const perArch = {};
for (const c of out) for (const [ai, list] of c.g) perArch[ARCHETYPES[ai]] = (perArch[ARCHETYPES[ai]] ?? 0) + list.length;
console.log("people per archetype:", perArch);
console.log("countries offering each archetype:", Object.fromEntries(ARCHETYPES.map((a) => [a, out.filter((c) => c.g.some(([i]) => ARCHETYPES[i] === a)).length])));
