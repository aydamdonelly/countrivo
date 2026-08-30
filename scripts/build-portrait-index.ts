/**
 * Writes src/data/portrait-slugs.json: the slugs that have a freely licensed portrait in
 * public/figures. The game reads this so a missing picture never causes a broken image.
 *
 * Run after scripts/fetch-portraits.ts and scripts/build-portraits.ts.
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "public", "figures");
const slugs = readdirSync(dir).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")).sort();
writeFileSync(join(process.cwd(), "src/data/portrait-slugs.json"), JSON.stringify(slugs));
console.log(`${slugs.length} portraits indexed`);
