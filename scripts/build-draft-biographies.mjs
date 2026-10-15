// Frozen public biography facts. Scores never depend on a request-time Wikipedia lookup.
// Run: node scripts/build-draft-biographies.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const pool = JSON.parse(readFileSync(new URL("../src/data/draft-pool.json", import.meta.url), "utf8"));
const portraits = new Set(JSON.parse(readFileSync(new URL("../src/data/portrait-slugs.json", import.meta.url), "utf8")));
const slugOf = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const target = new URL("../src/data/draft-biographies.json", import.meta.url);
const facts = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
const names = [...new Set(pool.p.flatMap((c) => c.g.flatMap(([, people]) => people.map(([name]) => name))))].filter((name) => portraits.has(slugOf(name)) && !facts[slugOf(name)]);
const headers = { "User-Agent": "CountrivoBiographyBuilder/3.0 (https://countrivo.com; countrivo@gmail.com)" };
const skipped = [];
async function request(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`Biography source returned ${response.status}; existing facts were preserved.`);
    const json = await response.json();
    if (json.error) throw new Error(`Biography source: ${JSON.stringify(json.error)}`);
    return json;
  }
  throw new Error("Biography source retries exhausted");
}
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
  const wiki = await request(`https://en.wikipedia.org/w/api.php?${params}`);
  if (!Array.isArray(wiki.query?.pages)) throw new Error("Wikipedia omitted its pages; existing facts were preserved.");
  const pages = wiki.query?.pages ?? [];
  const entities = pages.filter((p) => /^Q\d+$/.test(p.pageprops?.wikibase_item ?? ""));
  if (!entities.length) { skipped.push(...batch); continue; }
  const wdParams = new URLSearchParams({ action: "wbgetentities", format: "json", ids: entities.map((p) => p.pageprops.wikibase_item).join("|"), props: "claims" });
  const wd = await request(`https://www.wikidata.org/w/api.php?${wdParams}`);
  if (!wd.entities || typeof wd.entities !== "object") throw new Error("Wikidata omitted entities; existing facts were preserved.");
  for (const name of batch) {
    let redirected = wiki.query?.normalized?.find((r) => r.from === name)?.to ?? name;
    for (let depth = 0; depth < 10; depth += 1) {
      const next = wiki.query?.redirects?.find((r) => r.from === redirected)?.to;
      if (!next) break;
      redirected = next;
    }
    const page = pages.find((p) => slugOf(p.title) === slugOf(redirected));
    const entity = wd.entities?.[page?.pageprops?.wikibase_item];
    if (!entity || !/^Q\d+$/.test(entity.id ?? "") || entity.missing !== undefined || !entity.claims || page.pageprops?.disambiguation !== undefined) { skipped.push(name); continue; }
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
for (const [slug, fact] of Object.entries(facts)) {
  if (!/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/.test(fact.source ?? "") || !fact.biography?.startsWith("https://en.wikipedia.org/wiki/")) throw new Error(`Invalid biography sources for ${slug}; existing file preserved.`);
}
writeFileSync(target, JSON.stringify(facts, null, 2) + "\n");
console.log(`Saved ${Object.keys(facts).length} sourced biographies; skipped ${skipped.length}: ${skipped.join(", ") || "none"}.`);
