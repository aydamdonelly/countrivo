/**
 * Portraits for the Country Draft roster.
 *
 * Real people deserve real pictures, not a generic illustration reused with a disclaimer.
 * We take only freely licensed images from Wikimedia (public domain, CC0, CC BY, CC BY-SA),
 * record the licence and the author for every one of them, and leave the rest without a
 * portrait: the board draws our own ink monogram there. Nothing is invented.
 *
 * A figure's `wiki` title replaces its display name for the Wikipedia lookup when the name
 * is ambiguous, and `portraitFile` pins a specific Commons file instead of the article's
 * lead image. Only the credit is written here; scripts/build-portraits.ts downloads the
 * image at a bounded size, so no original ever lands in public/.
 *
 * Run: npx tsx scripts/fetch-portraits.ts [--limit N] [--only slug[,slug...] [--refresh]]
 * --refresh rereads the credit of the listed people, after their pinned file changed.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const UA = "CountrivoPortraits/1.1 (https://countrivo.com)";
// Wikimedia writes these as "CC BY-SA 4.0", "CC0", "Public domain", "PD-US".
const OK_LICENCE = /^(cc0|cc[ -]by([ -]sa)?([ -][\d.]+)?|public domain|pd[- ]|no restrictions|attribution)/i;

interface Figure { name: string; iso3: string; category: string; era: string; note: string; wiki?: string; portraitFile?: string }
interface Credit { slug: string; title: string; file: string; licence: string; author: string; url: string }
type Meta = Record<string, { value: string } | undefined>;

export function slugOf(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function api(params: Record<string, string>, host = "en.wikipedia.org"): Promise<Record<string, unknown>> {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as Record<string, unknown>;
}

const plain = (html: string | undefined) => (html ?? "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function fileMeta(file: string): Promise<{ ext: Meta; exists: boolean }> {
  const meta = (await api({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "extmetadata" }, "commons.wikimedia.org")) as
    { query?: { pages?: Array<{ missing?: boolean; imageinfo?: Array<{ extmetadata?: Meta }> }> } };
  const page = meta.query?.pages?.[0];
  return { ext: page?.imageinfo?.[0]?.extmetadata ?? {}, exists: Boolean(page && !page.missing && page.imageinfo?.length) };
}

async function leadImages(batch: Figure[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (!batch.length) return found;
  const lookup = (f: Figure) => f.wiki ?? f.name;
  const page = (await api({ action: "query", titles: batch.map(lookup).join("|"), prop: "pageimages|pageprops", piprop: "original", redirects: "1" })) as
    { query?: { pages?: Array<{ title: string; original?: { source: string }; pageprops?: { disambiguation?: string } }>; normalized?: Array<{ from: string; to: string }>; redirects?: Array<{ from: string; to: string }> } };
  const pages = page.query?.pages ?? [];
  for (const f of batch) {
    let title = page.query?.normalized?.find((n) => n.from === lookup(f))?.to ?? lookup(f);
    for (let depth = 0; depth < 10; depth += 1) {
      const next = page.query?.redirects?.find((r) => r.from === title)?.to;
      if (!next) break;
      title = next;
    }
    const hit = pages.find((p) => p.title === title) ?? pages.find((p) => p.title.toLowerCase() === lookup(f).toLowerCase()) ?? pages.find((p) => slugOf(p.title) === slugOf(f.name));
    const src = hit && hit.pageprops?.disambiguation === undefined ? hit.original?.source : undefined;
    if (src) found.set(slugOf(f.name), decodeURIComponent(src.split("?")[0].split("/").pop() ?? ""));
  }
  return found;
}

async function main() {
  const root = process.cwd();
  const data = JSON.parse(readFileSync(join(root, "src/data/figures.json"), "utf8")) as { figures: Figure[] };
  const limitArg = process.argv.indexOf("--limit");
  const onlyArg = process.argv.indexOf("--only");
  let figures = data.figures;
  if (onlyArg > -1) {
    const only = new Set((process.argv[onlyArg + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    figures = figures.filter((f) => only.has(slugOf(f.name)));
    const missing = [...only].filter((slug) => !figures.some((f) => slugOf(f.name) === slug));
    if (missing.length) throw new Error(`not in figures.json: ${missing.join(", ")}`);
  }
  if (limitArg > -1) figures = figures.slice(0, Number(process.argv[limitArg + 1]));
  const refresh = process.argv.includes("--refresh");
  if (refresh && onlyArg < 0) throw new Error("--refresh needs --only, so no existing credit is replaced by accident");

  const creditsPath = join(root, "src/data/figure-credits.json");
  const credits: Record<string, Credit> = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};
  const rejected: string[] = [];
  let got = 0, skipped = 0, none = 0;

  for (let i = 0; i < figures.length; i += 20) {
    const slice = figures.slice(i, i + 20);
    const batch = slice.filter((f) => refresh || !credits[slugOf(f.name)]);
    skipped += slice.length - batch.length;
    if (!batch.length) continue;
    const lead = await leadImages(batch.filter((f) => !f.portraitFile));
    for (const f of batch) {
      const slug = slugOf(f.name);
      const file = f.portraitFile?.replaceAll(" ", "_") ?? lead.get(slug);
      if (!file) { none++; rejected.push(`${f.name}: no lead image`); continue; }
      const { ext, exists } = await fileMeta(file);
      if (!exists) { none++; rejected.push(`${f.name}: ${file} not found on Commons`); continue; }
      const licence = plain(ext.LicenseShortName?.value ?? ext.License?.value);
      if (!OK_LICENCE.test(licence)) { none++; rejected.push(`${f.name}: ${licence || "no licence"} (${file})`); continue; }
      const author = (plain(ext.Artist?.value) || plain(ext.Credit?.value)).slice(0, 80);
      credits[slug] = { slug, title: f.name, file, licence, author: author || "unknown", url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` };
      // Earlier runs kept the full-size original next to the portrait; never leave one behind.
      const original = join(root, "public", "figures", `${slug}.src`);
      if (existsSync(original)) unlinkSync(original);
      got++;
    }
    writeFileSync(creditsPath, JSON.stringify(credits, null, 1));
    process.stdout.write(`\r${i + slice.length}/${figures.length}  kept ${got}  no free image ${none}   `);
  }
  console.log(`\ndone: ${got} portraits, ${none} without a free image, ${skipped} already had one`);
  for (const line of rejected) console.log(`  skipped ${line}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
