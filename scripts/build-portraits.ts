/**
 * Downloads each credited portrait at a sane size and writes the square the board loads.
 *
 * One pass, because a two-step pipeline with a cleanup phase once deleted every original
 * it had just fetched. Nothing is removed here that was not written by this run, and a
 * failure leaves the previous file in place.
 *
 * Run: npx tsx scripts/build-portraits.ts [--force] [--only slug]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const UA = "CountrivoPortraits/1.0 (https://countrivo.com; countrivo@gmail.com)";
const DIR = join(process.cwd(), "public", "figures");
const SIZE = 200;

interface Credit { slug: string; title: string; file: string; licence: string; author: string; url: string }

function sips(args: string[]): string {
  return execFileSync("sips", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

async function main() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const credits = JSON.parse(readFileSync(join(process.cwd(), "src/data/figure-credits.json"), "utf8")) as Record<string, Credit>;
  const force = process.argv.includes("--force");
  const onlyAt = process.argv.indexOf("--only");
  let list = Object.values(credits);
  if (onlyAt > -1) list = list.filter((c) => c.slug === process.argv[onlyAt + 1]);

  let done = 0, kept = 0, failed = 0;
  for (const c of list) {
    const out = join(DIR, `${c.slug}.jpg`);
    if (!force && existsSync(out)) { kept++; continue; }
    const tmp = join(DIR, `${c.slug}.download`);
    const cropped = join(DIR, `${c.slug}.crop.png`);
    try {
      const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.file)}?width=600`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!res.ok) throw new Error(String(res.status));
      writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      const info = sips(["-g", "pixelWidth", "-g", "pixelHeight", tmp]);
      const w = Number(info.match(/pixelWidth:\s*(\d+)/)?.[1]);
      const h = Number(info.match(/pixelHeight:\s*(\d+)/)?.[1]);
      if (!w || !h) throw new Error("unreadable");
      // A face sits high in a portrait, so the square is cut from the upper part.
      const side = Math.min(w, h);
      const offY = Math.max(0, Math.round((h - side) * 0.15));
      const offX = Math.max(0, Math.round((w - side) / 2));
      sips(["-c", String(side), String(side), "--cropOffset", String(offY), String(offX), tmp, "--out", cropped]);
      sips(["-Z", String(SIZE), "-s", "format", "jpeg", "-s", "formatOptions", "70", cropped, "--out", out]);
      if (!existsSync(out) || statSync(out).size < 500) throw new Error("empty output");
      done++;
    } catch {
      failed++;
    } finally {
      for (const f of [tmp, cropped]) if (existsSync(f)) unlinkSync(f);
    }
    if ((done + failed) % 25 === 0) process.stdout.write(`\r${done + failed + kept}/${list.length}  built ${done}  failed ${failed}   `);
  }
  const files = readdirSync(DIR).filter((f) => f.endsWith(".jpg"));
  const mb = files.reduce((n, f) => n + statSync(join(DIR, f)).size, 0) / 1024 / 1024;
  console.log(`\n${done} built, ${kept} already there, ${failed} failed; ${files.length} portraits, ${mb.toFixed(1)} MB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
