/**
 * Download a real SVG flag for every country into public/flags/{iso2}.svg
 * (countries.json already bakes flagSvgPath = '/flags/{iso2}.svg'). Source:
 * flagcdn.com (public-domain SVGs). Run: `npx tsx scripts/fetch-flags.ts`.
 * Countries without a flagcdn entry simply fall back to the emoji in the UI.
 */
import { mkdir, writeFile } from "node:fs/promises";

interface Country {
  iso2: string;
}

async function main() {
  const countries: Country[] = JSON.parse(
    await (await import("node:fs/promises")).readFile("src/data/countries.json", "utf8"),
  );
  await mkdir("public/flags", { recursive: true });

  let ok = 0;
  const failed: string[] = [];
  for (const c of countries) {
    const iso2 = (c.iso2 || "").toLowerCase();
    if (!iso2) continue;
    try {
      const res = await fetch(`https://flagcdn.com/${iso2}.svg`);
      if (!res.ok) {
        failed.push(iso2);
        continue;
      }
      const svg = await res.text();
      if (!svg.includes("<svg")) {
        failed.push(iso2);
        continue;
      }
      await writeFile(`public/flags/${iso2}.svg`, svg);
      ok++;
    } catch {
      failed.push(iso2);
    }
  }
  console.log(`flags: ${ok} downloaded, ${failed.length} missing` + (failed.length ? ` (${failed.join(", ")})` : ""));
}

main();
