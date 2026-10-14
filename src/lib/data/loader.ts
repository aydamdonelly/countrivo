import portraitCreditsData from "@/data/figure-credits.json";
import bordersData from "@/data/borders.json";
import geographyData from "@/data/geography.json";
export { countries, categories, capitalsAccepted, centroids, sovereignIso3 } from './public';

// gameRegistry now lives in the lightweight "@/lib/data/registry" module so
// client components can access it without dragging in countries/categories JSON.
export { gameRegistry } from "./registry";

// These are loaded dynamically since they're large
let _ranks: Record<string, Record<string, number>> | null = null;
let _stats: Record<string, Record<string, number | null>> | null = null;

export async function getRanks(): Promise<Record<string, Record<string, number>>> {
  if (!_ranks) {
    _ranks = (await import("@/data/ranks.json")).default;
  }
  return _ranks!;
}

export async function getStats(): Promise<Record<string, Record<string, number | null>>> {
  if (!_stats) {
    _stats = (await import("@/data/stats.json")).default;
  }
  return _stats!;
}

export interface CountryGeometry { path: string; polygons: number[][][][] }
export interface GeographyData { source: string; sourceUrl: string; viewBox: string; land: string; countries: Record<string, CountryGeometry> }
export const geography: GeographyData = geographyData;
export { coastline } from './coastline';

export { draftPool, draftPortraits, draftBiography, draftPortraitCredit, draftCareerRecord, draftCareerRecords } from './draft';
export const countryBorders: Readonly<Record<string, readonly string[]>> = bordersData;
export { worldAtlas } from './world-atlas';

export const portraitCredits = portraitCreditsData;

export { draftConquestMap } from './draft-map';
import clayOgJson from '@/data/clay-og.json';
export const clayOg: Readonly<Record<string, string>> = clayOgJson;
