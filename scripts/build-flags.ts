/**
 * Copies the 4:3 flag SVGs of the MIT-licensed `flag-icons` package into
 * public/flags/{iso2}.svg for every country in src/data/countries.json,
 * overwriting the old 3:2 files under the SAME filenames (so /flags/{iso2}.svg,
 * `flagSvgPath` and the proxy matcher exclusion survive).
 *
 * Run: npx tsx scripts/build-flags.ts
 *
 * A code missing from the package keeps its current file and is printed; a code
 * with no file at all fails the build. Every copied file is checked for the 640x480
 * viewBox the 4:3 set composes non-rectangular flags (Nepal) onto.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface CountryLike {
  iso2: string;
}

const root = process.cwd();
const src = path.join(root, "node_modules", "flag-icons", "flags", "4x3");
const out = path.join(root, "public", "flags");

if (!existsSync(src)) {
  console.error("flag-icons is not installed (npm i -D flag-icons)");
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const countries: CountryLike[] = JSON.parse(readFileSync(path.join(root, "src", "data", "countries.json"), "utf8"));

let copied = 0;
const kept: string[] = [];
const missing: string[] = [];
const badViewBox: string[] = [];

for (const c of countries) {
  const iso2 = (c.iso2 || "").toLowerCase();
  if (!iso2) continue;
  const from = path.join(src, `${iso2}.svg`);
  const to = path.join(out, `${iso2}.svg`);
  if (existsSync(from)) {
    const svg = readFileSync(from, "utf8");
    if (!svg.includes('viewBox="0 0 640 480"')) badViewBox.push(iso2);
    copyFileSync(from, to);
    copied++;
  } else if (existsSync(to)) {
    kept.push(iso2);
  } else {
    missing.push(iso2);
  }
}

// A tiny attribution file next to the flags (the package is MIT).
writeFileSync(
  path.join(out, "LICENSE.txt"),
  "Flags: flag-icons (https://github.com/lipis/flag-icons), MIT License, 4x3 set copied by scripts/build-flags.ts.\n",
);

console.log(`flags: ${copied} copied from flag-icons 4x3, ${kept.length} kept as they were, ${missing.length} missing`);
if (kept.length) console.log(`kept (no flag-icons file): ${kept.join(", ")}`);
if (badViewBox.length) {
  console.error(`viewBox is not 0 0 640 480 for: ${badViewBox.join(", ")}`);
  process.exit(1);
}
if (missing.length) {
  console.error(`no flag file at all for: ${missing.join(", ")}`);
  process.exit(1);
}
