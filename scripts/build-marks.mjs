// Builds src/assets/marks/conquest.json: Natural Earth land (world-atlas 110m) plus
// the five "taken" countries of the World Draft mark, projected with NaturalEarth1
// fitted to a 320x150 box and simplified in projected space so the whole file
// stays under 8 KB. Rendered by src/ui/conquest-map.tsx at any size (viewBox 0 0 320 150).
// Run: node scripts/build-marks.mjs
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { writeFileSync } from "node:fs";

const ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 320;
const H = 150;
const BUDGET = 8 * 1024;
// world-atlas numeric ids -> ISO3 of the countries the mark shows as taken.
const TAKEN = { "076": "BRA", "566": "NGA", "036": "AUS", "392": "JPN", "152": "CHL" };

const topo = await (await fetch(ATLAS)).json();
const land = feature(topo, topo.objects.countries);
const proj = geoNaturalEarth1().fitSize([W, H], land);

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

function fmt(n) {
  return String(Math.round(n));
}

/** Relative integer path commands: the whole 320x150 map in a few KB. */
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

const landRings = rings(land);
const takenRings = Object.fromEntries(
  land.features.filter((f) => f.id in TAKEN).map((f) => [TAKEN[f.id], rings(f)]),
);
if (Object.keys(takenRings).length !== 5) throw new Error("taken countries not all found in the atlas");

let json = null;
for (const [tol, minSpan] of [[0.6, 2], [0.8, 2.4], [1, 2.8], [1.2, 3.2], [1.4, 3.6], [1.6, 4], [1.8, 4.5], [2, 5]]) {
  const candidate = {
    viewBox: `0 0 ${W} ${H}`,
    land: toPath(landRings, tol, minSpan),
    countries: Object.fromEntries(Object.entries(takenRings).map(([k, r]) => [k, toPath(r, Math.min(tol, 0.8), 1.5)])),
  };
  const s = JSON.stringify(candidate);
  console.log(`tolerance ${tol}px: ${s.length} bytes`);
  json = s;
  if (s.length <= BUDGET) break;
}
if (json.length > BUDGET) throw new Error(`conquest.json is ${json.length} bytes, over the ${BUDGET} byte budget`);
writeFileSync(new URL("../src/assets/marks/conquest.json", import.meta.url), json + "\n");
console.log("wrote src/assets/marks/conquest.json", json.length, "bytes");
