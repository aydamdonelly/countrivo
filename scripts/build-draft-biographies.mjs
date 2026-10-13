// Frozen public biography facts. Scores never depend on a request-time Wikipedia lookup.
// Run: node scripts/build-draft-biographies.mjs
import { readFileSync, writeFileSync } from "node:fs";

const pool = JSON.parse(readFileSync(new URL("../src/data/draft-pool.json", import.meta.url), "utf8"));
const portraits = new Set(JSON.parse(readFileSync(new URL("../src/data/portrait-slugs.json", import.meta.url), "utf8")));
const slugOf = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const names = [...new Set(pool.p.flatMap((c) => c.g.flatMap(([, people]) => people.map(([name]) => name))))].filter((name) => portraits.has(slugOf(name)));
const headers = { "User-Agent": "CountrivoBiographyBuilder/2.0 (https://countrivo.com)" };
const facts = {};
function yearOf(value) {
  const time = value?.time;
  if (typeof time !== "string") return null;
  const match = time.match(/^([+-])(\d+)-/);
  return match ? Number(match[2]) * (match[1] === "-" ? -1 : 1) : null;
}
function claimYear(entity, property, order) {
  const years = (entity.claims?.[property] ?? []).filter((c) => c.rank !== "deprecated").map((c) => yearOf(c.mainsnak?.datavalue?.value)).filter((y) => y !== null);
  return years.length ? (order === "first" ? Math.min(...years) : Math.max(...years)) : null;
}
for (let i = 0; i < names.length; i += 40) {
  const batch = names.slice(i, i + 40);
  const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", titles: batch.join("|"), prop: "pageprops", redirects: "1" });
  const wiki = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { headers }).then((r) => r.json());
  const pages = wiki.query?.pages ?? [];
  const entities = pages.filter((p) => /^Q\d+$/.test(p.pageprops?.wikibase_item ?? ""));
  if (!entities.length) continue;
  const wdParams = new URLSearchParams({ action: "wbgetentities", format: "json", ids: entities.map((p) => p.pageprops.wikibase_item).join("|"), props: "claims" });
  const wd = await fetch(`https://www.wikidata.org/w/api.php?${wdParams}`, { headers }).then((r) => r.json());
  for (const name of batch) {
    const redirected = wiki.query?.redirects?.find((r) => r.from === name)?.to ?? name;
    const page = pages.find((p) => slugOf(p.title) === slugOf(redirected));
    const entity = wd.entities?.[page?.pageprops?.wikibase_item];
    if (!entity) continue;
    const born = claimYear(entity, "P569", "first");
    const died = claimYear(entity, "P570", "last");
    let activeFrom = claimYear(entity, "P2031", "first");
    let activeUntil = claimYear(entity, "P2032", "last");
    const offices = entity.claims?.P39 ?? [];
    const starts = offices.flatMap((c) => c.qualifiers?.P580 ?? []).map((s) => yearOf(s.datavalue?.value)).filter((y) => y !== null);
    const ends = offices.flatMap((c) => c.qualifiers?.P582 ?? []).map((s) => yearOf(s.datavalue?.value)).filter((y) => y !== null);
    if (starts.length) activeFrom = Math.min(...starts, ...(activeFrom === null ? [] : [activeFrom]));
    if (ends.length) activeUntil = Math.max(...ends, ...(activeUntil === null ? [] : [activeUntil]));
    facts[slugOf(name)] = { born, died, activeFrom, activeUntil, source: `https://www.wikidata.org/wiki/${entity.id}`, biography: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}` };
  }
  console.log(`Biographies: ${Math.min(i + 40, names.length)} / ${names.length}`);
}
writeFileSync(new URL("../src/data/draft-biographies.json", import.meta.url), JSON.stringify(facts, null, 2) + "\n");
console.log(`Saved ${Object.keys(facts).length} sourced biographies.`);
