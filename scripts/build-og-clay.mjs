import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const slugs=['country-draft','geo-wordle','pinpoint','flag-quiz','higher-or-lower','stat-guesser','blind-pick','speed-flags','globe'];
const scratch=mkdtempSync(join(tmpdir(),'countrivo-og-clay-'));
const images=Object.fromEntries(slugs.map(slug=>{
  const source=fileURLToPath(new URL(`../public/clay/${slug}.png`,import.meta.url)),output=join(scratch,`${slug}.png`);
  if(spawnSync('sips',['-Z','180',source,'--out',output],{stdio:'ignore'}).status!==0)throw new Error(`OG resize failed: ${slug}`);
  return [slug,`data:image/png;base64,${readFileSync(output).toString('base64')}`];
}));
writeFileSync(new URL('../src/data/clay-og.json',import.meta.url),JSON.stringify(images)+'\n');
console.log(`Prepared ${slugs.length} compact OG objects`);
