import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

// The previous Commons image has a disputed public-domain claim. This staff
// photograph has an item-specific LoC rights statement and a Commons PD notice.
const sourceUrl = "https://upload.wikimedia.org/wikipedia/commons/8/84/Martin_Luther_King_Jr_NYWTS.jpg";
const sourceSha256 = "147a90c8d5f5d1fdd4f9a2263fe15b45f15b397eb27b36dcacdacd5c01d35c9d";
const itemUrl = "https://www.loc.gov/pictures/item/00651714/";
const metadataUrl = `${itemUrl}?fo=json`;
const directory = ".check-render/pool-audit";
mkdirSync(directory, { recursive: true });

async function cachedDownload(path, url) {
  if (existsSync(path)) return readFileSync(path);
  const response = await fetch(url, { signal: AbortSignal.timeout(40_000) });
  assert.ok(response.ok, `${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(path, bytes);
  return bytes;
}

const source = await cachedDownload(`${directory}/mlk-nywts-source.jpg`, sourceUrl);
assert.equal(createHash("sha256").update(source).digest("hex"), sourceSha256);
const metadata = JSON.parse(await cachedDownload(`${directory}/mlk-loc-metadata.json`, metadataUrl));
assert.equal(metadata.item.id, "00651714");
assert.match(metadata.item.title, /Martin Luther King/);
assert.match(metadata.item.stmt_of_responsibility, /Dick DeMarsico/);
assert.match(metadata.item.rights_information, /No known restrictions on publication for NYWT&S staff photographs/);

const crop = { left: 720, top: 120, width: 1300, height: 1300 };
const destination = "public/figures/martin-luther-king-jr.jpg";
const portrait = await sharp(source).extract(crop).resize(200, 200).jpeg({ quality: 90 }).toBuffer();
writeFileSync(destination, portrait);

const creditsFile = "src/data/figure-credits.json";
const credits = JSON.parse(readFileSync(creditsFile, "utf8"));
assert.equal(credits["martin-luther-king-jr"].slug, "martin-luther-king-jr");
const credit = {
  slug: "martin-luther-king-jr",
  title: "Martin Luther King Jr.",
  file: "Martin_Luther_King_Jr_NYWTS.jpg",
  licence: "Public domain",
  author: "Dick DeMarsico, New York World-Telegram & Sun staff photographer",
  url: "https://commons.wikimedia.org/wiki/File:Martin_Luther_King_Jr_NYWTS.jpg",
  attribution: "Dick DeMarsico, 1964. Library of Congress, New York World-Telegram and the Sun Newspaper Photograph Collection, LC-USZ62-126559. Cropped for Countrivo.",
  licenceNotice: "Library of Congress: No known restrictions on publication for NYWT&S staff photographs. Commons identifies this pre-1968 staff photograph as public domain under the collection's instrument of gift.",
  originalSource: itemUrl,
  licenceUrl: "https://hdl.loc.gov/loc.pnp/res.076.nyw",
};
credits[credit.slug] = credit;
writeFileSync(creditsFile, JSON.stringify(credits, null, 1));

const evidence = {
  sourceUrl, sourceSha256, metadataUrl, crop, destination,
  outputBytes: portrait.length,
  outputSha256: createHash("sha256").update(portrait).digest("hex"),
  credit,
};
writeFileSync(`${directory}/mlk-replacement-evidence.json`, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
