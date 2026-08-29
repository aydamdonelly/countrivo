import { CHIP_LABELS } from "@/content/chips";
import type { Country } from "@/types/country";

/**
 * The house label for a statistic (blueprint 10.6): the draft chip wording where there is
 * one, so a board reads `Urban share`, not the registry's Title Case `Urban Population`.
 * Categories outside the 20 draft chips (military spending) keep their registry label.
 */
export function statLabel(slug: string, fallback: string): string {
  return CHIP_LABELS[slug] ?? fallback;
}

/** `1280` as `1 280` (the voice spaces its thousands). */
export function spaceThousands(n: number): string {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

/** `Americas · South America` (blueprint 3.20). */
export function countryMeta(c: Country): string {
  return c.subregion && c.subregion !== c.continent ? `${c.continent} · ${c.subregion}` : c.continent;
}

/** `3:42` from milliseconds. */
export function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** `24 % off` style percentage with the spaced unit. */
export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)} %`;
}

/** Base-36 digit for an index 0..35 (the codec convention for indices). */
export function idx36(i: number): string {
  return i.toString(36);
}

export function from36(ch: string): number {
  const n = parseInt(ch, 36);
  if (!Number.isInteger(n)) throw new Error(`bad index token ${ch}`);
  return n;
}

/** Number parsing shared by the typed-number games: `1.5M`, `200K`, `3B`, `1,4`, `1,500`. */
export function parseHumanNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  if (s.includes(",") && !s.includes(".")) {
    const parts = s.split(",");
    s = parts.length === 2 && parts[1].length !== 3 ? `${parts[0]}.${parts[1]}` : s.replace(/,/g, "");
  } else {
    s = s.replace(/,/g, "");
  }
  const m = s.match(/^([0-9]*\.?[0-9]+)([kmbt])?$/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const mult: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  if (m[2]) n *= mult[m[2]];
  return Number.isFinite(n) ? n : null;
}
