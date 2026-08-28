// Builds src/data/silhouettes.json: one SVG path per country (ISO3), fitted into a
// 100×100 box, from Natural Earth 1:110m via world-atlas. Run: node scripts/build-silhouettes.mjs
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { readFileSync, writeFileSync } from "node:fs";

const ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const topo = await (await fetch(ATLAS)).json();
const land = feature(topo, topo.objects.countries);
const countries = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));

// Natural Earth names that differ from ours.
const ALIAS = {
  "United States of America": "United States", "Dem. Rep. Congo": "DR Congo", "Congo": "Republic of the Congo",
  "Central African Rep.": "Central African Republic", "S. Sudan": "South Sudan", "Eq. Guinea": "Equatorial Guinea",
  "Côte d'Ivoire": "Ivory Coast", "eSwatini": "Eswatini", "W. Sahara": "Western Sahara", "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Czechia": "Czechia", "North Macedonia": "North Macedonia", "Dominican Rep.": "Dominican Republic",
  "Solomon Is.": "Solomon Islands", "Timor-Leste": "Timor-Leste", "Falkland Is.": "Falkland Islands", "Fr. S. Antarctic Lands": null,
  "N. Cyprus": null, "Somaliland": null, "Antarctica": null, "Kosovo": "Kosovo", "Bhutan": "Bhutan", "Brunei": "Brunei",
  "Macedonia": "North Macedonia", "Vatican": "Vatican City", "Cabo Verde": "Cape Verde", "Micronesia": "Micronesia", "St. Vin. and Gren.": "Saint Vincent and the Grenadines",
  "Antigua and Barb.": "Antigua and Barbuda", "St. Kitts and Nevis": "Saint Kitts and Nevis", "São Tomé and Principe": "São Tomé and Príncipe", "Marshall Is.": "Marshall Islands",
  "Palestine": "Palestine", "Myanmar": "Myanmar", "Laos": "Laos", "Vietnam": "Vietnam", "Syria": "Syria", "Iran": "Iran", "Russia": "Russia", "Bolivia": "Bolivia", "Venezuela": "Venezuela", "Tanzania": "Tanzania", "Taiwan": "Taiwan", "South Korea": "South Korea", "North Korea": "North Korea",
};
const byName = new Map();
for (const c of countries) { byName.set(c.name, c.iso3); if (c.displayName) byName.set(c.displayName, c.iso3); }
const out = {}; const missed = [];
for (const f of land.features) {
  const ne = f.properties?.name; if (!ne) continue;
  const name = ne in ALIAS ? ALIAS[ne] : ne; if (name === null) continue;
  const iso3 = byName.get(name); if (!iso3) { missed.push(ne); continue; }
  const proj = geoMercator().fitExtent([[2, 2], [98, 98]], f);
  const d = geoPath(proj)(f);
  if (d) out[iso3] = d.replace(/(\d)\.(\d)\d+/g, "$1.$2");
}
writeFileSync(new URL("../src/data/silhouettes.json", import.meta.url), JSON.stringify(out));
console.log("silhouettes:", Object.keys(out).length, "| unmatched:", missed.join(", ") || "none");
