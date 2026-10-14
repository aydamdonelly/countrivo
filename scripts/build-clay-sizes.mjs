import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

let originalBytes = 0, smallBytes = 0, count = 0;
for (const folder of readdirSync('public/clay', { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  const directory = join('public/clay', folder.name);
  for (const file of readdirSync(directory).filter(name => name.endsWith('.webp') && !/\.(128|256)\.webp$/.test(name))) {
    const source = join(directory, file);
    originalBytes += statSync(source).size;
    for (const width of [128, 256]) {
      const output = source.replace(/\.webp$/, `.${width}.webp`);
      const encoded = spawnSync('cwebp', ['-quiet', '-q', '86', '-resize', String(width), String(width), source, '-o', output]);
      if (encoded.status !== 0) throw new Error(`Clay resize failed: ${source}`);
      if (width === 128) smallBytes += statSync(output).size;
    }
    count += 1;
  }
}
console.log(`${count} responsive Clay states: 128px images use ${Math.round(smallBytes / originalBytes * 100)}% of the original bytes.`);
