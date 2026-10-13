// Freeze each person's recorded occupations, offices and military ranks before assigning game ratings.
import { readFileSync, writeFileSync } from "node:fs";

const biographies = JSON.parse(readFileSync(new URL("../src/data/draft-biographies.json", import.meta.url), "utf8"));
const pool = JSON.parse(readFileSync(new URL("../src/data/draft-pool.json", import.meta.url), "utf8"));
const slugOf = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const names = new Map(pool.p.flatMap((country) => country.g.flatMap(([, people]) => people.map(([name]) => [slugOf(name), name]))));
const headers = { "User-Agent": "CountrivoCareerRecords/1.0 (https://countrivo.com)" };
async function entities(ids, props) {
  const result = {};
  for (let index = 0; index < ids.length; index += 40) {
    const params = new URLSearchParams({ action: "wbgetentities", format: "json", ids: ids.slice(index, index + 40).join("|"), props, languages: "en" });
    const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { headers });
    if (!response.ok) throw new Error(`Wikidata returned ${response.status}`);
    const json = await response.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    Object.assign(result, json.entities);
  }
  return result;
}
const ids = Object.values(biographies).map((person) => person.source.split("/").at(-1));
const people = await entities(ids, "claims|sitelinks");
const claimItems = (entity, property) => (entity.claims?.[property] ?? []).filter((claim) => claim.rank !== "deprecated" && claim.mainsnak.snaktype === "value").map((claim) => ({
  id: claim.mainsnak.datavalue?.value?.id,
  claim: claim.id,
  referenced: (claim.references?.length ?? 0) > 0,
})).filter((item) => item.id);
const jobIds = [...new Set(Object.values(people).flatMap((person) => ["P106", "P39", "P410"].flatMap((property) => claimItems(person, property).map((item) => item.id))))];
const jobs = await entities(jobIds, "labels");
const records = {};
for (const [slug, bio] of Object.entries(biographies)) {
  const id = bio.source.split("/").at(-1);
  const person = people[id];
  if (!person) continue;
  const listed = (property) => claimItems(person, property).map((item) => ({ ...item, label: jobs[item.id]?.labels?.en?.value ?? item.id, source: `${bio.source}#${property}` }));
  records[slug] = { name: names.get(slug) ?? slug, source: bio.source, biography: bio.biography, sitelinks: Object.keys(person.sitelinks ?? {}).length,
    occupations: listed("P106"), offices: listed("P39"), militaryRanks: listed("P410") };
}
writeFileSync(new URL("../src/data/draft-records.json", import.meta.url), JSON.stringify(records, null, 2) + "\n");
console.log(`Saved ${Object.keys(records).length} sourced person records (${jobIds.length} distinct recorded roles).`);
