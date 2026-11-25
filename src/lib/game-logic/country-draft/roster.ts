import { draftBiography, draftCareerRecord, draftCareerRecords, draftPool, draftPoolV3, draftPortraits } from "@/lib/data/loader";
import { careerRatings, fameRating } from "./career-ratings";
import { applyCareerEvidence } from "./career-evidence";
import type { DraftFigure } from "./types";

export interface PoolGroup { archetype: number; people: readonly DraftFigure[]; }
export interface PoolCountry { iso3: string; iso2: string; name: string; region: string; continent: number; groups: readonly PoolGroup[]; }

export function figureSlug(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const PORTRAITS = new Set(draftPortraits);
const IDENTITIES = ["Public figure", "Historical figure", "Business figure", "Cultural figure", "Inventor and thinker", "Writer and thinker", "Sporting figure", "Historical figure"];
export const CONTINENTS: readonly string[] = draftPool.t;

/** Facts and records written before stamping existed belong to pool 3. */
const UNSTAMPED_VERSION = 3;
function inPool(entry: { since?: number } | undefined, version: number): boolean {
  return entry !== undefined && (entry.since ?? UNSTAMPED_VERSION) <= version;
}

/** Source errors corrected from pool 4 on. Pool 3 boards keep the facts they were dealt with. */
const FACT_CORRECTIONS: Readonly<Record<string, { born: number | null }>> = {
  // The source gives 2005 for a pirate who died in 1721. Her birth year is not reliably known.
  "mary-read": { born: null },
};

/** Every person is rated against the records that existed for their pool, so fame never shifts on an old board. */
function buildPool(source: typeof draftPool): readonly PoolCountry[] {
  const version = source.v;
  const records = Object.values(draftCareerRecords).filter((record) => inPool(record, version));
  const careerOf = (slug: string) => { const record = draftCareerRecord(slug); return inPool(record, version) ? record : undefined; };
  const factsOf = (slug: string) => {
    const facts = draftBiography(slug);
    if (!facts || !inPool(facts, version)) return undefined;
    const correction = version > UNSTAMPED_VERSION ? FACT_CORRECTIONS[slug] : undefined;
    return correction ? { ...facts, ...correction } : facts;
  };
  return source.p.map((c) => ({
    iso3: c.c, iso2: c.i, name: c.n, region: c.r, continent: c.t,
    groups: c.g.map((group) => {
      const archetypeValue = group[0];
      const peopleValue = group[1];
      if (typeof archetypeValue !== "number" || !Array.isArray(peopleValue)) throw new Error("Invalid draft pool group");
      return {
        archetype: archetypeValue,
        people: peopleValue.map((person): DraftFigure => {
          if (!Array.isArray(person)) throw new Error("Invalid draft person");
          const [name, standing, note] = person;
          if (typeof name !== "string" || typeof standing !== "number" || typeof note !== "string") throw new Error("Invalid draft person fields");
          const slug = figureSlug(name);
          const facts = factsOf(slug);
          const career = careerOf(slug);
          const homeland = c.g.flatMap(([, entries]) => Array.isArray(entries) ? entries.flatMap((entry) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return [];
            const found = careerOf(figureSlug(entry[0]));
            return found ? [found] : [];
          }) : []);
          const activeUntil = facts?.activeUntil ?? facts?.died ?? null;
          const recent = activeUntil !== null ? activeUntil > 1950 : (facts?.born ?? 0) > 1915;
          return {
            name, slug, portrait: PORTRAITS.has(slug) && facts !== undefined && career !== undefined, note, identity: IDENTITIES[archetypeValue] ?? "Public figure", archetype: archetypeValue, standing,
            born: facts?.born ?? null, died: facts?.died ?? null, activeFrom: facts?.activeFrom ?? null, activeUntil: facts?.activeUntil ?? null,
            era: activeUntil !== null && activeUntil < 1900 ? "early" : recent ? "recent" : "middle",
            source: facts?.source ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replaceAll(" ", "_"))}`,
            biography: facts?.biography ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replaceAll(" ", "_"))}`,
            ...(career ? { ...applyCareerEvidence(slug, careerRatings(career, { archetype: archetypeValue, primaryNote: note })), fame: fameRating(career, records, homeland) } : {}),
          };
        }),
      };
    }),
  }));
}

/**
 * The first Berlin day dealt from pool 4. Today's and tomorrow's boards were already promised
 * from pool 3 when pool 4 was built, so every earlier date keeps that pool exactly.
 */
export const POOL_CUTOVER_DATE = "2026-11-27";

/** The current pool. Boards without a date (tests, tools) use it. */
export const POOL: readonly PoolCountry[] = buildPool(draftPool);
const RETIRED_POOL: readonly PoolCountry[] = buildPool(draftPoolV3);

function retired(dateKey: string | undefined): boolean {
  return dateKey !== undefined && dateKey < POOL_CUTOVER_DATE;
}

export function poolFor(dateKey?: string): readonly PoolCountry[] {
  return retired(dateKey) ? RETIRED_POOL : POOL;
}

// New country-choice boards cannot be replayed as the old five-country model.
export const POOL_VERSION = draftPool.v + 3;

/** The version stamped into a saved result, matching the pool its board was dealt from. */
export function poolVersionFor(dateKey?: string): number {
  return (retired(dateKey) ? draftPoolV3.v : draftPool.v) + 3;
}
