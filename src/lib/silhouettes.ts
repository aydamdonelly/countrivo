import silhouettes from "@/data/silhouettes.json";
import { countries } from "@/lib/data/loader";

const PATHS: Record<string, string> = silhouettes;
const ISO2_TO_ISO3 = new Map(countries.map((c) => [c.iso2, c.iso3]));

/** SVG path (100×100 box) of a country outline, by ISO3. Server-only data: 96 KB. */
export function getSilhouettePath(iso3: string | null | undefined): string | null {
  if (!iso3) return null;
  return PATHS[iso3.toUpperCase()] ?? null;
}

export function iso2ToIso3(iso2: string | null | undefined): string | null {
  if (!iso2) return null;
  return ISO2_TO_ISO3.get(iso2.toUpperCase()) ?? null;
}
