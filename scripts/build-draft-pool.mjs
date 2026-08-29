// Builds src/data/draft-pool.json: the Country Draft candidate pool (P9). figures.json is
// 164 KB and the board has to be rebuilt in the browser from the seed alone (resume replay
// and hydration parity), so the roster is packed down to only what a round can offer:
// the countries that can field three different archetypes, capped at CAP people per
// archetype, with the 12 authored categories folded into the 8 archetypes the fit table
// scores. Standing is the person's position inside their country's list in their own
// category, which figures.json orders most-canonical-first.
// Run: node scripts/build-draft-pool.mjs
import { writeFileSync, readFileSync, existsSync } from "node:fs";

// Stamped into every payload and compared by the server validator. Bump it in the same
// commit as any roster change; the build refuses to write a changed pool under an
// unchanged version, so this cannot drift by accident.
const POOL_VERSION = 1;

const PER_CATEGORY = 2;      // people kept per (country, authored category)
const CAP = 5;               // people kept per (country, archetype), the standing ladder 5..1
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
const byIso = new Map(countries.map((c) => [c.iso3, c]));

const authored = new Set(roster.categories.map((c) => c.id));
for (const id of authored) if (!OF_CATEGORY[id]) throw new Error(`category ${id} has no archetype`);
for (const id of Object.keys(OF_CATEGORY)) if (!authored.has(id)) throw new Error(`archetype map names unknown category ${id}`);

const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u;

// A country's bench for one archetype is built in the order figures.json already holds:
// the most canonical name of each of that archetype's categories first, at most two per
// category, capped at five. Standing is the position on that bench, so standing 5 is the
// first name the country would give you for that kind of person.
const bench = new Map();  // iso3 -> archetype -> people[]
const cellCount = new Map();
for (const [order, f] of roster.figures.entries()) {
  if (!byIso.has(f.iso3)) throw new Error(`unknown iso3 ${f.iso3} on ${f.name}`);
  if (EMOJI.test(f.name) || EMOJI.test(f.note)) throw new Error(`emoji in the roster: ${f.name}`);
  if (f.name.length > 28) throw new Error(`name too long: ${f.name}`);
  if (f.note.length > 52) throw new Error(`note too long on ${f.name}`);
  if (!sovereign.has(f.iso3)) continue;
  const cell = `${f.iso3}|${f.category}`;
  const idx = cellCount.get(cell) ?? 0;
  cellCount.set(cell, idx + 1);
  if (idx >= PER_CATEGORY) continue;
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
    out.set(archetype, list.slice(0, CAP).map((p, i) => ({ name: p.name, note: p.note, standing: 5 - i })));
  }
  kept.set(iso3, out);
}

const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
const out = [];
for (const [iso3, byArch] of [...kept].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  if (byArch.size < MIN_ARCHETYPES) continue;
  // A round must be able to offer three different archetypes whose standings are not all
  // equal, or the pick would be a coin toss between three identical-looking people.
  const arches = [...byArch.keys()].sort((a, b) => ARCHETYPES.indexOf(a) - ARCHETYPES.indexOf(b));
  let spread = false;
  for (let a = 0; a < arches.length && !spread; a++)
    for (let b = a + 1; b < arches.length && !spread; b++)
      for (let c = b + 1; c < arches.length && !spread; c++) {
        const s = [byArch.get(arches[a]), byArch.get(arches[b]), byArch.get(arches[c])];
        const lo = s.map((g) => Math.min(...g.map((p) => p.standing)));
        const hi = s.map((g) => Math.max(...g.map((p) => p.standing)));
        if (Math.max(...hi) !== Math.min(...lo)) spread = true;
      }
  if (!spread) continue;
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
