// Builds the step pictures for "How to play" (26 November 2026): three 4:3 crops per daily game from
// 390 px wide phone captures at 3x (reports/2026-11-25/visual-qa/.ph-harness.mjs, fixture runs that
// write nothing). Each crop is the part of the real screen its step describes. Output: public/howto/{slug}-{n}.webp, 600x450.
// Run: node scripts/build-howto-images.mjs <capture dir> [slug...]  (the capture dir also holds sf-*/cq-* practice captures;
// pass slugs to rebuild only those games)
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const source = process.argv[2];
const only = new Set(process.argv.slice(3));
if (!source) throw new Error('Pass the capture directory (390 px captures at 3x).');
// [capture, top in CSS px, height in CSS px (default 292, a 4:3 crop)]. A taller crop keeps the full
// 390 px width, is scaled to 450 px high and centred on the page colour.
const CROPS = {
  'country-draft': [['cd-01-start', 362], ['cd-03-jobs', 345], ['cd-04-seated', 180]],
  'geo-wordle': [['gw-01-start', 210], ['gw-02-mid', 500], ['gw-02-mid', 90]],
  'pinpoint': [['pp-01-start', 100], ['pp-02-pin', 160], ['pp-03-reveal', 105]],
  'flag-quiz': [['fq-01-ready', 200], ['fq-02-mid', 140], ['fq-03-result', 137]],
  'higher-or-lower': [['hol-01-start', 182], ['hol-02-reveal', 130], ['hol-03-result', 137]],
  'stat-guesser': [['sg-01-start', 200], ['sg-02-reveal', 190], ['sg-03-result', 137]],
  'blind-pick': [['bp-01-start', 50], ['bp-02-mid', 180], ['bp-03-complete', 50]],
  'speed-flags': [['sf-03-after', 250, 520], ['sf-04-mid', 250, 520], ['sf-05-result', 72]],
  'capital-quiz': [['cq-01-ask', 225, 400], ['cq-02-reveal', 240, 420], ['cq-01-ask', 80]],
};
mkdirSync('public/howto', { recursive: true });
const scratch = join(tmpdir(), 'countrivo-howto');
mkdirSync(scratch, { recursive: true });
let count = 0;
for (const [slug, crops] of Object.entries(CROPS)) {
  if (only.size && !only.has(slug)) continue;
  crops.forEach(([capture, top, height = 292], index) => {
    const png = join(scratch, `${slug}-${index + 1}.png`);
    const crop = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(source, `${capture}.png`), '-vf', `crop=1170:${height * 3}:0:${top * 3},scale=600:450:force_original_aspect_ratio=decrease:flags=lanczos,pad=600:450:(ow-iw)/2:(oh-ih)/2:0xfbfaf6`, png]);
    if (crop.status !== 0) throw new Error(`Crop failed: ${slug} ${capture} ${crop.stderr}`);
    const webp = spawnSync('cwebp', ['-quiet', '-q', '82', png, '-o', `public/howto/${slug}-${index + 1}.webp`]);
    if (webp.status !== 0) throw new Error(`Encode failed: ${slug}-${index + 1}`);
    count += 1;
  });
}
console.log(`${count} step pictures in public/howto`);
