// Builds src/assets/marks/draft-map.json: the Country Draft result artifact (P9). Natural
// Earth land (world-atlas 50m) plus one outline per sovereign state, projected with
// NaturalEarth1 fitted to a 640x300 box and simplified in projected space. The board is
// scored out of 195 and the artifact fills that many countries, so every one of the 195
// needs its own path; the land layer underneath carries the territories and the coastline.
// Rendered by src/games/country-draft/draft-map.tsx at any size (viewBox 0 0 640 300).
// Run: node scripts/build-draft-map.mjs
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { writeFileSync, readFileSync } from "node:fs";

const ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const W = 640;
const BUDGET = 96 * 1024;

const SOVEREIGN = JSON.parse(readFileSync(new URL("../src/data/sovereign.json", import.meta.url), "utf8"));

// world-atlas prints short cartographic names; these are the ones countries.json spells out.
const ALIAS = {
  "Vatican": "VAT",
  "Marshall Is.": "MHL",
  "United States of America": "USA",
  "S. Sudan": "SSD",
  "Solomon Is.": "SLB",
  "São Tomé and Principe": "STP",
  "St. Vin. and Gren.": "VCT",
  "St. Kitts and Nevis": "KNA",
  "Macedonia": "MKD",
  "Eq. Guinea": "GNQ",
  "Dominican Rep.": "DOM",
  "Côte d'Ivoire": "CIV",
  "Dem. Rep. Congo": "COD",
  "Congo": "COG",
  "Central African Rep.": "CAF",
  "Cabo Verde": "CPV",
  "Bosnia and Herz.": "BIH",
  "Antigua and Barb.": "ATG",
};

const countries = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
const byName = new Map();
for (const c of countries) {
  byName.set(norm(c.name), c.iso3);
  byName.set(norm(c.displayName), c.iso3);
}
for (const [name, iso3] of Object.entries(ALIAS)) byName.set(norm(name), iso3);

const topo = await (await fetch(ATLAS)).json();
const all = feature(topo, topo.objects.countries);
// Antarctica is land but it is nobody's country, and drawing it costs a quarter of the
// box in dead grey. The map is fitted to the inhabited world instead.
const land = { type: "FeatureCollection", features: all.features.filter((f) => f.properties.name !== "Antarctica") };
const fitted = geoNaturalEarth1().fitWidth(W, land);
const bounds = geoPath(fitted).bounds(land);
const H = Math.round(bounds[1][1] - bounds[0][1]);
const proj = geoNaturalEarth1().fitExtent([[0, 0], [W, H]], land);

/** Records the projected rings d3 streams into a canvas-like context. */
function rings(geo) {
  const out = [];
  let cur = null;
  const ctx = {
    moveTo(x, y) { cur = [[x, y]]; out.push(cur); },
    lineTo(x, y) { cur.push([x, y]); },
    closePath() {},
    arc() {},
    beginPath() {},
  };
  geoPath(proj, ctx)(geo);
  return out;
}

function dpSimplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1; keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (len2 === 0) d = Math.hypot(px - ax, py - ay);
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const fmt = (n) => String(Math.round(n));

/** Relative integer path commands: the whole 640x300 map in a few tens of KB. */
function toPath(ringList, tol, minSpan) {
  let d = "";
  for (const ring of ringList) {
    const s = dpSimplify(ring, tol);
    if (s.length < 3) continue;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of s) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX - minX < minSpan && maxY - minY < minSpan) continue;
    let px = Math.round(s[0][0]), py = Math.round(s[0][1]);
    let seg = `M${px},${py}`;
    let n = 0;
    for (let i = 1; i < s.length; i++) {
      const x = Math.round(s[i][0]), y = Math.round(s[i][1]);
      const dx = x - px, dy = y - py;
      if (dx === 0 && dy === 0) continue;
      if (dy === 0) seg += `h${fmt(dx)}`;
      else if (dx === 0) seg += `v${fmt(dy)}`;
      else seg += `l${fmt(dx)},${fmt(dy)}`;
      px = x; py = y; n++;
    }
    if (n < 2) continue;
    d += seg + "Z";
  }
  return d;
}

const wanted = new Set(SOVEREIGN);
const found = new Map();
for (const f of land.features) {
  const iso3 = byName.get(norm(f.properties.name));
  if (!iso3 || !wanted.has(iso3)) continue;
  found.set(iso3, rings(f));
}
const absent = SOVEREIGN.filter((c) => !found.has(c));
if (absent.length > 1) throw new Error(`sovereign states with no atlas geometry: ${absent.join(", ")}`);
// Tuvalu (26 km2) has no 50m outline; it is sub-pixel at this scale either way.
console.log("sovereign outlines:", found.size, "of", SOVEREIGN.length, absent.length ? `(no geometry: ${absent.join(", ")})` : "");

let json = null;
let drawn = 0;
for (const [tol, minSpan, cTol, cSpan] of [[1, 3, 0.3, 0.45], [1.2, 3.4, 0.45, 1], [1.4, 3.8, 0.6, 1.2], [1.8, 4.4, 0.8, 1.4], [2.2, 5, 1, 1.6]]) {
  const paths = {};
  for (const [iso3, r] of found) {
    const d = toPath(r, cTol, cSpan);
    if (d) paths[iso3] = d;
  }
  const candidate = { viewBox: `0 0 ${W} ${H}`, land: toPath(rings(land), tol, minSpan), countries: paths };
  const s = JSON.stringify(candidate);
  drawn = Object.keys(paths).length;
  console.log(`land ${tol}px / country ${cTol}px: ${s.length} bytes, ${drawn} outlines`);
  json = s;
  if (s.length <= BUDGET) break;
}
if (json.length > BUDGET) throw new Error(`draft-map.json is ${json.length} bytes, over the ${BUDGET} byte budget`);
writeFileSync(new URL("../src/assets/marks/draft-map.json", import.meta.url), json + "\n");
console.log("wrote src/assets/marks/draft-map.json", json.length, "bytes,", drawn, "country outlines");
