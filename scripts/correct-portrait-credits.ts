import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

interface PortraitCredit {
  slug: string;
  title: string;
  file: string;
  licence: string;
  author: string;
  url: string;
}

const file = "src/data/figure-credits.json";
const credits: Record<string, PortraitCredit> = JSON.parse(readFileSync(file, "utf8"));
const bhutto = credits["benazir-bhutto"];
// Commons specifies this credit separately from the Artist metadata fetched originally.
// https://commons.wikimedia.org/wiki/File:Oliver_Mark_-_Benazir_Bhutto,_Dubai_2006_(cropped).jpg
assert.equal(bhutto.file, "Oliver_Mark_-_Benazir_Bhutto,_Dubai_2006_(cropped).jpg");
assert.equal(bhutto.licence, "CC BY-SA 4.0");
credits[bhutto.slug] = { ...bhutto, author: "\u00a9 Oliver Mark" };
writeFileSync(file, JSON.stringify(credits, null, 1));
console.log("Corrected Benazir Bhutto portrait attribution to Oliver Mark.");
