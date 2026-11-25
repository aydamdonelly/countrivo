/**
 * Stand-in Clay art for the Blind Pick categories that have no artwork of their own yet.
 * Every Blind Pick slot loads `public/clay/stat-<slug>/rest{,.256,.128}.webp`, so a category
 * without that folder would show a broken image. Until new clay art is made through the
 * pipeline in docs/concept/blind-pick-clay-icons/, this copies an existing, fitting object
 * byte for byte and records where each copy came from in aliases.json.
 *
 * When real art arrives: drop the slug from ALIASES, add its record to provenance.json as
 * for the original nine, and re-run this script.
 *
 * Run: node scripts/build-blind-pick-clay-aliases.mjs
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const FRAMES = ['rest.webp', 'rest.256.webp', 'rest.128.webp'];

/**
 * Density and farmland reuse the city and the trees, so the rotation keeps each of them off
 * any board that already has urban population or forest cover (SEPARATE_PAIRS in
 * src/lib/game-logic/blind-pick/rotation.ts). Furthest north reuses the upward arrow.
 */
const ALIASES = {
  'population-density': { from: 'stat-urban-population-pct', reason: 'Packed buildings for people per km²' },
  latitude: { from: 'cl-04', reason: 'An upward arrow: north is up on the map' },
  'arable-land-pct': { from: 'stat-forest-coverage-pct', reason: 'Growing plants for land used for crops' },
};

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const records = [];
for (const [slug, { from, reason }] of Object.entries(ALIASES)) {
  const target = join(root, 'public/clay', `stat-${slug}`);
  mkdirSync(target, { recursive: true });
  const outputs = FRAMES.map((frame) => {
    const source = join(root, 'public/clay', from, frame);
    const output = join(target, frame);
    copyFileSync(source, output);
    return { file: `public/clay/stat-${slug}/${frame}`, source: `public/clay/${from}/${frame}`, sha256: sha256(output) };
  });
  records.push({ slug, standIn: true, from, reason, outputs });
}

const manifest = join(root, 'docs/concept/blind-pick-clay-icons/aliases.json');
writeFileSync(manifest, `${JSON.stringify({ note: 'Stand-in art copied from existing Clay objects until dedicated icons are made.', records }, null, 2)}\n`);
console.log(`${records.length} stand-in Blind Pick icons: ${records.map((r) => `${r.slug} <- ${r.from}`).join(', ')}`);
