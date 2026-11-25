import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const width = 600, height = 450;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// The national artwork stays intact. Only its material, relief and lighting change.
function distanceField(seeds) {
  const d = Float32Array.from(seeds, v => v ? 0 : width + height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x) d[i] = Math.min(d[i], d[i - 1] + 1);
    if (y) d[i] = Math.min(d[i], d[i - width] + 1);
    if (x && y) d[i] = Math.min(d[i], d[i - width - 1] + Math.SQRT2);
    if (x + 1 < width && y) d[i] = Math.min(d[i], d[i - width + 1] + Math.SQRT2);
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    if (x + 1 < width) d[i] = Math.min(d[i], d[i + 1] + 1);
    if (y + 1 < height) d[i] = Math.min(d[i], d[i + width] + 1);
    if (x + 1 < width && y + 1 < height) d[i] = Math.min(d[i], d[i + width + 1] + Math.SQRT2);
    if (x && y + 1 < height) d[i] = Math.min(d[i], d[i + width - 1] + Math.SQRT2);
  }
  return d;
}

function grain(x, y) {
  let n = Math.imul(x + 101, 374761393) + Math.imul(y + 31, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295 - .5;
}

function clayNoise(x, y, scale) {
  const px = x / scale, py = y / scale, ix = Math.floor(px), iy = Math.floor(py);
  const sx = px - ix, sy = py - iy;
  const u = sx * sx * (3 - 2 * sx), v = sy * sy * (3 - 2 * sy);
  const top = grain(ix, iy) * (1 - u) + grain(ix + 1, iy) * u;
  const bottom = grain(ix, iy + 1) * (1 - u) + grain(ix + 1, iy + 1) * u;
  return top * (1 - v) + bottom * v;
}

async function render(svg) {
  const source = await sharp(svg).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const alpha = new Float32Array(width * height);
  const outside = new Uint8Array(alpha.length), seams = new Uint8Array(alpha.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x, q = i * 4;
    const dx = Math.abs(x - width / 2) - (width / 2 - 28);
    const dy = Math.abs(y - height / 2) - (height / 2 - 28);
    const round = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - 28;
    const softEdge = .65 * Math.sin(x * .041) + .45 * Math.sin(y * .057);
    alpha[i] = source[q + 3] / 255 * clamp(.5 - round + softEdge);
    outside[i] = alpha[i] < .5 || !x || !y || x === width - 1 || y === height - 1 ? 1 : 0;
    for (const j of [x ? q - 4 : q, y ? q - width * 4 : q]) {
      if (Math.max(...[0, 1, 2].map(c => Math.abs(source[q + c] - source[j + c]))) > 30) seams[i] = 1;
    }
  }
  const edge = distanceField(outside), region = distanceField(seams);
  const z = new Float32Array(alpha.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const bevel = Math.sin(clamp(edge[i] / 26) * Math.PI / 2) * 14;
    const relief = Math.sin(clamp(region[i] / 9) * Math.PI / 2) * 3.2;
    const kneaded = 2.4 * clayNoise(x, y, 36) + .65 * clayNoise(x, y, 9)
      + .12 * clayNoise(x, y, 2) + .04 * grain(x, y);
    z[i] = bevel + relief + kneaded;
  }
  const smoothed = new Float32Array(z.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    smoothed[i] = (z[i] * 4 + z[i - 1] + z[i + 1] + z[i - width] + z[i + width]) / 8;
  }
  const front = Buffer.alloc(width * height * 4), base = Buffer.alloc(front.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x, q = i * 4;
    const nx = (smoothed[y * width + Math.max(0, x - 1)] - smoothed[y * width + Math.min(width - 1, x + 1)]) / 2;
    const ny = (smoothed[Math.max(0, y - 1) * width + x] - smoothed[Math.min(height - 1, y + 1) * width + x]) / 2;
    const length = Math.hypot(nx, ny, 1);
    const light = clamp((-nx * .42 - ny * .56 + .72) / length);
    const diffuse = .69 + .41 * light;
    const specular = 7 * Math.pow(clamp((-nx * .23 - ny * .3 + .925) / length), 10);
    const occlusion = 1 - .045 * (1 - clamp(region[i] / 3));
    for (let c = 0; c < 3; c++) {
      const pigment = source[q + c] * .94 + 9;
      front[q + c] = clamp(pigment * diffuse * occlusion + specular + grain(x, y) * .4, 0, 255);
      base[q + c] = clamp(pigment * .66, 0, 255);
    }
    front[q + 3] = base[q + 3] = Math.round(alpha[i] * 255);
  }
  const raw = { width, height, channels: 4 };
  // A shallow same-pigment edge gives the slab thickness without a separate frame.
  const mask = Buffer.alloc(front.length);
  for (let i = 0; i < alpha.length; i++) {
    mask[i * 4] = 23; mask[i * 4 + 1] = 24; mask[i * 4 + 2] = 26; mask[i * 4 + 3] = Math.round(alpha[i] * 56);
  }
  const contact = await sharp(mask, { raw }).blur(5).png().toBuffer();
  return sharp({ create: { width: 640, height: 480, channels: 4, background: '#00000000' } }).composite([
    { input: contact, left: 20, top: 22 },
    { input: base, raw, left: 20, top: 15 },
    { input: front, raw, left: 20, top: 8 },
  ]).png().toBuffer();
}

const selected = process.argv.slice(2);
const output = path.join(root, 'public/clay-flags');
await mkdir(output, { recursive: true });
const countries = (await readdir(path.join(root, 'public/flags'))).filter(f => f.endsWith('.svg') && (!selected.length || selected.includes(f.slice(0, -4)))).sort();
const manifest = [];
for (const file of countries) {
  const svg = await readFile(path.join(root, 'public/flags', file));
  const png = await render(svg);
  const code = file.slice(0, -4);
  for (const size of [96, 240, 640]) {
    await sharp(png).resize(size, size * 3 / 4).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(output, `${code}${size === 640 ? '' : `.${size}`}.webp`));
  }
  manifest.push({ code, sourceSha256: createHash('sha256').update(svg).digest('hex') });
  if (selected.length) await writeFile(`/tmp/countrivo-clay-flag-${code}.png`, png);
}
if (!selected.length) {
  const byHash = new Map(manifest.map(m => [m.sourceSha256, m.code]));
  await mkdir(path.join(output, 'quiz'), { recursive: true });
  for (const file of (await readdir(path.join(root, 'public/quiz-flags'))).filter(f => f.endsWith('.svg')).sort()) {
    const svg = await readFile(path.join(root, 'public/quiz-flags', file));
    const code = byHash.get(createHash('sha256').update(svg).digest('hex'));
    const data = code ? await readFile(path.join(output, `${code}.webp`)) : await sharp(await render(svg)).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
    await writeFile(path.join(output, 'quiz', file.replace('.svg', '.webp')), data);
  }
  await mkdir(path.join(root, 'docs/concept/clay-flags'), { recursive: true });
  await writeFile(path.join(root, 'docs/concept/clay-flags/provenance.json'), JSON.stringify({ method: 'Local deterministic material rendering of the original SVG artwork; no generative API', renderer: 'scripts/build-clay-flags.mjs', sizes: [96, 240, 640], flags: manifest }, null, 2) + '\n');
}
console.log(`Rendered ${countries.length} clay flags locally (no generation API).`);
