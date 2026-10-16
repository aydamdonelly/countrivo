import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const metric = 'military-spending-pct';
const results = [];

// Remove only this restricted extract. Saved daily boards live separately in the
// database and must not be regenerated or rewritten by a source-data correction.
for (const name of ['stats', 'ranks']) {
  const file = new URL(`../src/data/${name}.json`, import.meta.url);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  assert.ok(data && typeof data === 'object' && !Array.isArray(data));
  let removed = 0;
  const retained = Object.fromEntries(Object.entries(data).map(([iso3, row]) => {
    assert.ok(row && typeof row === 'object' && !Array.isArray(row), `Invalid ${name} row: ${iso3}`);
    if (Object.hasOwn(row, metric)) removed += 1;
    return [iso3, Object.fromEntries(Object.entries(row).filter(([slug]) => slug !== metric))];
  }));
  if (removed) writeFileSync(file, JSON.stringify(retained, null, 2));
  results.push({ file: `src/data/${name}.json`, removed });
}
console.log(JSON.stringify({ withheld: metric, results }));
