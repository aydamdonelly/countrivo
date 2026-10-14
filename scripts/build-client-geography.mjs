// The display map is simpler than the immutable geometry used to score a dropped pin.
import { readFileSync, writeFileSync } from 'node:fs';

const dataRoot = new URL('../src/data/', import.meta.url);
const coastline = JSON.parse(readFileSync(new URL('geography-coastline.json', dataRoot), 'utf8'));
const geography = JSON.parse(readFileSync(new URL('geography.json', dataRoot), 'utf8'));
const atlas = JSON.parse(readFileSync(new URL('world-atlas.json', dataRoot), 'utf8'));

function signedArea(points) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
}

function simplify(ring, tolerance) {
  if (ring.length < 6) return ring;
  const points = [...ring, ring[0]];
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
  const result = points.filter((_, index) => keep.has(index)).slice(0, -1);
  // Keep small islands and the original winding of lake cutouts.
  return result.length >= 3 && Math.sign(signedArea(ring)) === Math.sign(signedArea(result)) ? result : ring;
}

function compactPath(path, tolerance) {
  const rings = path.match(/M[^Z]+Z/g);
  if (!rings || rings.join('') !== path) throw new Error('Unexpected map SVG commands');
  return rings.map(ring => {
    const points = [...ring.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(match => [Number(match[1]), Number(match[2])]);
    return `M${simplify(points, tolerance).map(([x, y]) => `${x},${y}`).join('L')}Z`;
  }).join('');
}

const land = compactPath(coastline.land, 0.1);
writeFileSync(new URL('client-coastline.json', dataRoot), JSON.stringify({ viewBox: coastline.viewBox, land }) + '\n');
// Paths identify any publicly known country, never the hidden daily answer.
const paths = Object.fromEntries(Object.entries(geography.countries).map(([iso3, shape]) => [iso3, shape.path]));
writeFileSync(new URL('map-country-paths.json', dataRoot), JSON.stringify(paths) + '\n');
const shapes = Object.fromEntries(Object.entries(atlas.shapes).map(([iso3, path]) => [iso3, compactPath(path, 0.2)]));
writeFileSync(new URL('client-world-atlas.json', dataRoot), JSON.stringify({ ...atlas, shapes }) + '\n');
console.log(`Display coastline: ${coastline.land.length} → ${land.length} bytes; ${coastline.land.match(/M/g).length} rings preserved`);
console.log(`Display atlas: ${JSON.stringify(atlas).length} → ${JSON.stringify({ ...atlas, shapes }).length} bytes; ${Object.keys(shapes).length} countries and ${Object.keys(atlas.points).length} island points preserved`);
