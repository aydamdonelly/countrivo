// Land borders between countries, drawn only on the Pinpoint reveal and result maps.
// Same Natural Earth 1:50m source and equirectangular projection as build-geography.mjs,
// so the lines sit exactly on the coastline and the answer outline.
// Regenerate: node scripts/build-map-borders.mjs. No new runtime dependencies.
import { geoEquirectangular, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';

const source = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const response = await fetch(source);
if (!response.ok) throw new Error(`Atlas download failed: ${response.status}`);
const topo = await response.json();
const { viewBox } = JSON.parse(readFileSync(new URL('../src/data/geography-coastline.json', import.meta.url), 'utf8'));
const projection = geoEquirectangular().scale(360 / Math.PI).translate([360, 170]);
const path = geoPath(projection).digits(2);

// Only arcs shared by two different countries: the coastline is already drawn as land.
const lines = mesh(topo, topo.objects.countries, (a, b) => a !== b);
const projected = path(lines);

// Douglas-Peucker on open polylines, in map units. The reveal zooms to at most 20x.
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    const [ax, ay] = points[start], [bx, by] = points[end];
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    let largest = tolerance * tolerance, furthest = -1;
    for (let index = start + 1; index < end; index++) {
      const [x, y] = points[index];
      const fraction = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
      const distance = (x - ax - fraction * dx) ** 2 + (y - ay - fraction * dy) ** 2;
      if (distance > largest) { largest = distance; furthest = index; }
    }
    if (furthest >= 0) { keep.add(furthest); stack.push([start, furthest], [furthest, end]); }
  }
  return points.filter((_, index) => keep.has(index));
}

const segments = projected.match(/M[^M]+/g) ?? [];
const borders = segments.map(segment => {
  const points = [...segment.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(match => [Number(match[1]), Number(match[2])]);
  return `M${simplify(points, 0.1).map(([x, y]) => `${x},${y}`).join('L')}`;
}).join('');

writeFileSync(new URL('../src/data/client-map-borders.json', import.meta.url), JSON.stringify({ viewBox, borders }) + '\n');
console.log(`Map borders: ${projected.length} → ${borders.length} bytes; ${segments.length} lines`);
