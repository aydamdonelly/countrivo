import { writeFileSync } from 'node:fs';
import { worldAtlas } from '../src/lib/data/loader';

// A shared, cacheable SVG keeps the complete world geometry out of every home response.
const shapes = Object.values(worldAtlas.shapes).map(path => `<path d="${path}"/>`).join('');
writeFileSync('public/design/day-map.svg', `<svg xmlns="http://www.w3.org/2000/svg"><symbol id="land" viewBox="${worldAtlas.viewBox}">${shapes}</symbol></svg>`);
console.log('Built the reusable daily discovery map.');
