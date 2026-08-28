/**
 * One-off: removes the emoji fields from the data JSON the UI reads.
 *   src/data/game-registry.json  -> `emoji`
 *   src/data/categories.json     -> `emoji`
 *   src/data/countries.json      -> `flagEmoji`
 * Flags are SVG files (public/flags), stat icons and game marks are drawn SVG
 * components; the types dropped these fields with the rebuild. JSON is never
 * hand-edited, so this script rewrites the files with their existing 2-space format.
 *
 * Run: npx tsx scripts/strip-emoji.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const jobs: Array<{ file: string; keys: string[] }> = [
  { file: "src/data/game-registry.json", keys: ["emoji"] },
  { file: "src/data/categories.json", keys: ["emoji"] },
  { file: "src/data/countries.json", keys: ["flagEmoji"] },
];

for (const { file, keys } of jobs) {
  const abs = path.join(root, file);
  const raw = readFileSync(abs, "utf8");
  const rows: Array<Record<string, unknown>> = JSON.parse(raw);
  let removed = 0;
  for (const row of rows) {
    for (const k of keys) {
      if (k in row) {
        delete row[k];
        removed++;
      }
    }
  }
  writeFileSync(abs, JSON.stringify(rows, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
  console.log(`${file}: removed ${removed} ${keys.join("/")} field(s) from ${rows.length} rows`);
}
