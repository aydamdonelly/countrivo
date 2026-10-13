import pool from "@/data/draft-pool.json";
import portraits from "@/data/portrait-slugs.json";
import biographies from "@/data/draft-biographies.json";
import records from "@/data/draft-records.json";
import credits from "@/data/figure-credits.json";
import stats from "@/data/stats.json";
import sovereign from "@/data/sovereign.json";
import { countries } from "./loader";

export interface DraftBiography {
  born: number | null;
  died: number | null;
  activeFrom: number | null;
  activeUntil: number | null;
  source: string;
  biography: string;
}

export interface DraftPortraitCredit {
  author: string;
  licence: string;
  url: string;
}
export interface DraftCareerClaim { id: string; claim: string; referenced: boolean; label: string; source: string; }
export interface DraftCareerRecord {
  name: string;
  source: string;
  biography: string;
  sitelinks: number;
  occupations: readonly DraftCareerClaim[];
  offices: readonly DraftCareerClaim[];
  militaryRanks: readonly DraftCareerClaim[];
}

export const draftPool = pool;
export const draftPortraits: readonly string[] = portraits;
const biographyIndex: Readonly<Record<string, DraftBiography>> = biographies;
const creditIndex: Readonly<Record<string, DraftPortraitCredit>> = credits;
export const draftCareerRecords: Readonly<Record<string, DraftCareerRecord>> = records;
export function draftCareerRecord(slug: string): DraftCareerRecord | undefined { return draftCareerRecords[slug]; }
export function draftBiography(slug: string): DraftBiography | undefined { return biographyIndex[slug]; }
export function draftPortraitCredit(slug: string): DraftPortraitCredit | undefined { return creditIndex[slug]; }

const statIndex: Readonly<Record<string, Readonly<Record<string, number | null>>>> = stats;
export function draftHomelandTotals(iso3s: readonly string[]) {
  const homes = [...new Set(iso3s)];
  const population = homes.reduce((sum, iso3) => sum + (statIndex[iso3]?.population ?? 0), 0);
  const area = homes.reduce((sum, iso3) => sum + (statIndex[iso3]?.["area-km2"] ?? 0), 0);
  const worldArea = sovereign.reduce((sum, iso3) => sum + (statIndex[iso3]?.["area-km2"] ?? 0), 0);
  return { population, area, areaPercent: worldArea ? area / worldArea * 100 : 0 };
}

export function draftCountrySlug(iso3: string): string { return countries.find((country) => country.iso3 === iso3)?.slug ?? iso3.toLowerCase(); }
