/**
 * Portraits for the Country Draft roster.
 *
 * Real people deserve real pictures, not a generic illustration reused with a disclaimer.
 * We take only freely licensed images from Wikimedia (public domain, CC0, CC BY, CC BY-SA),
 * record the licence and the author for every one of them, and leave the rest without a
 * portrait: the board draws our own ink monogram there. Nothing is invented.
 *
 * Run: npx tsx scripts/fetch-portraits.ts [--limit N] [--only slug]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const UA = "CountrivoPortraits/1.0 (https://countrivo.com; countrivo@gmail.com)";
// Wikimedia writes these as "CC BY-SA 4.0", "CC0", "Public domain", "PD-US".
const OK_LICENCE = /^(cc0|cc[ -]by([ -]sa)?([ -][\d.]+)?|public domain|pd[- ]|no restrictions|attribution)/i;

interface Figure { name: string; iso3: string; category: string; era: string; note: string }
interface Credit { slug: string; title: string; file: string; licence: string; author: string; url: string }

export function slugOf(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function api(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as Record<string, unknown>;
}

async function main() {
  const root = process.cwd();
  const outDir = join(root, "public", "figures");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const data = JSON.parse(readFileSync(join(root, "src/data/figures.json"), "utf8")) as { figures: Figure[] };
  const limitArg = process.argv.indexOf("--limit");
  const onlyArg = process.argv.indexOf("--only");
  let figures = data.figures;
  if (onlyArg > -1) figures = figures.filter((f) => slugOf(f.name) === process.argv[onlyArg + 1]);
  if (limitArg > -1) figures = figures.slice(0, Number(process.argv[limitArg + 1]));

  const creditsPath = join(root, "src/data/figure-credits.json");
  const credits: Record<string, Credit> = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};
  let got = 0, skipped = 0, none = 0;

  for (let i = 0; i < figures.length; i += 20) {
    const batch = figures.slice(i, i + 20).filter((f) => !credits[slugOf(f.name)]);
    if (!batch.length) { skipped += 20; continue; }
    const titles = batch.map((f) => f.name).join("|");
    const page = (await api({ action: "query", titles, prop: "pageimages", piprop: "original", redirects: "1" })) as
      { query?: { pages?: Array<{ title: string; original?: { source: string } }> } };
    const pages = page.query?.pages ?? [];
    for (const f of batch) {
      const slug = slugOf(f.name);
      const hit = pages.find((p) => p.title.toLowerCase() === f.name.toLowerCase()) ?? pages.find((p) => slugOf(p.title) === slug);
      const src = hit?.original?.source;
      if (!src) { none++; continue; }
      const file = decodeURIComponent((src.split("?")[0].split("/").pop() ?? ""));
      const meta = (await api({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "extmetadata" })) as
        { query?: { pages?: Array<{ imageinfo?: Array<{ extmetadata?: Record<string, { value: string }> }> }> } };
      const ext = meta.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata ?? {};
      const licence = (ext.LicenseShortName?.value ?? ext.License?.value ?? "").replace(/<[^>]*>/g, "").trim();
      if (!OK_LICENCE.test(licence)) { none++; continue; }
      const author = (ext.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
      const img = await fetch(src, { headers: { "User-Agent": UA } });
      if (!img.ok) { none++; continue; }
      writeFileSync(join(outDir, `${slug}.src`), Buffer.from(await img.arrayBuffer()));
      credits[slug] = { slug, title: f.name, file, licence, author: author || "unknown", url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` };
      got++;
    }
    writeFileSync(creditsPath, JSON.stringify(credits, null, 1));
    process.stdout.write(`\r${i + batch.length}/${figures.length}  kept ${got}  no free image ${none}   `);
  }
  console.log(`\ndone: ${got} portraits, ${none} without a free image, ${skipped} already had one`);
}

main().catch((e) => { console.error(e); process.exit(1); });
