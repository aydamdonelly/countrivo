import silhouettes from "@/data/silhouettes.json";
import { countries } from "@/lib/data/loader";

const PATHS: Record<string, string> = silhouettes;
const ISO2_TO_ISO3 = new Map(countries.map((c) => [c.iso2, c.iso3]));
const ISO3_TO_ISO2 = new Map(countries.map((c) => [c.iso3, c.iso2]));

/** SVG path (100×100 box) of a country outline, by ISO3. Server-only data: 96 KB. */
export function getSilhouettePath(iso3: string | null | undefined): string | null {
  if (!iso3) return null;
  return PATHS[iso3.toUpperCase()] ?? null;
}

/** profiles.country_code holds ISO3 (the profile form) but older rows may hold ISO2; accept both. */
export function iso2ToIso3(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c.length === 3) return ISO3_TO_ISO2.has(c) ? c : null;
  return ISO2_TO_ISO3.get(c) ?? null;
}

/** ISO2 (lowercase) for /public/flags, from either code length. */
export function toFlagCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c.length === 2) return ISO2_TO_ISO3.has(c) ? c.toLowerCase() : null;
  const iso2 = ISO3_TO_ISO2.get(c);
  return iso2 ? iso2.toLowerCase() : null;
}
