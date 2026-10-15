// Freeze each person's recorded occupations, offices and military ranks before assigning game ratings.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const biographies = JSON.parse(readFileSync(new URL("../src/data/draft-biographies.json", import.meta.url), "utf8"));
const pool = JSON.parse(readFileSync(new URL("../src/data/draft-pool.json", import.meta.url), "utf8"));
const slugOf = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const names = new Map(pool.p.flatMap((country) => country.g.flatMap(([, people]) => people.map(([name]) => [slugOf(name), name]))));
const target = new URL("../src/data/draft-records.json", import.meta.url);
const records = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
const missing = Object.entries(biographies).filter(([slug]) => names.has(slug) && !records[slug]);
const headers = { "User-Agent": "CountrivoCareerRecords/1.0 (https://countrivo.com)" };
async function entities(ids, props) {
  const result = {};
  for (let index = 0; index < ids.length; index += 40) {
    const params = new URLSearchParams({ action: "wbgetentities", format: "json", ids: ids.slice(index, index + 40).join("|"), props, languages: "en" });
    let json;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { headers, signal: AbortSignal.timeout(30_000) });
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
        continue;
      }
      if (!response.ok) throw new Error(`Wikidata returned ${response.status}; existing career records preserved.`);
      json = await response.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      break;
    }
    if (!json?.entities || typeof json.entities !== "object") throw new Error("Wikidata omitted entities; existing career records preserved.");
    Object.assign(result, json.entities);
  }
  return result;
}
const ids = [...new Set(missing.map(([, person]) => person.source.split("/").at(-1)))];
if (ids.some((id) => !/^Q\d+$/.test(id ?? ""))) throw new Error("A biography has no valid Wikidata identity; existing records preserved.");
const people = await entities(ids, "claims|sitelinks");
const claimItems = (entity, property) => (entity.claims?.[property] ?? []).filter((claim) => claim.rank !== "deprecated" && claim.mainsnak.snaktype === "value").map((claim) => ({
  id: claim.mainsnak.datavalue?.value?.id,
  claim: claim.id,
  referenced: (claim.references?.length ?? 0) > 0,
})).filter((item) => item.id);
const jobIds = [...new Set(Object.values(people).flatMap((person) => ["P106", "P39", "P410"].flatMap((property) => claimItems(person, property).map((item) => item.id))))];
const jobs = await entities(jobIds, "labels");
const skipped = [];
for (const [slug, bio] of missing) {
  const id = bio.source.split("/").at(-1);
  const person = people[id];
  if (!person || person.missing !== undefined || !person.claims || !person.sitelinks) { skipped.push(slug); continue; }
  const listed = (property) => claimItems(person, property).map((item) => ({ ...item, label: jobs[item.id]?.labels?.en?.value ?? item.id, source: `${bio.source}#${property}` }));
  records[slug] = { name: names.get(slug) ?? slug, source: bio.source, biography: bio.biography, sitelinks: Object.keys(person.sitelinks ?? {}).length,
    occupations: listed("P106"), offices: listed("P39"), militaryRanks: listed("P410") };
}
for (const [slug, record] of Object.entries(records)) {
  if (!/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/.test(record.source ?? "") || !record.name || !Number.isInteger(record.sitelinks) || ![record.occupations, record.offices, record.militaryRanks].every(Array.isArray)) throw new Error(`Invalid career record for ${slug}; existing file preserved.`);
}
writeFileSync(target, JSON.stringify(records, null, 2) + "\n");
console.log(`Saved ${Object.keys(records).length} sourced person records (${missing.length - skipped.length} added, ${jobIds.length} new recorded roles); skipped: ${skipped.join(", ") || "none"}.`);
