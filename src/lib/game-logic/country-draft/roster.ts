import { draftBiography, draftCareerRecord, draftCareerRecords, draftPool, draftPortraits } from "@/lib/data/loader";
import { careerRatings, fameRating } from "./career-ratings";
import { applyCareerEvidence } from "./career-evidence";
import type { DraftFigure } from "./types";

export interface PoolGroup { archetype: number; people: readonly DraftFigure[]; }
export interface PoolCountry { iso3: string; iso2: string; name: string; region: string; continent: number; groups: readonly PoolGroup[]; }

export function figureSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const PORTRAITS = new Set(draftPortraits);
const IDENTITIES = ["Public figure", "Historical figure", "Business figure", "Cultural figure", "Inventor and thinker", "Writer and thinker", "Sporting figure", "Historical figure"];
const RECORDS = Object.values(draftCareerRecords);
export const CONTINENTS: readonly string[] = draftPool.t;

export const POOL: readonly PoolCountry[] = draftPool.p.map((c) => ({
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
        const facts = draftBiography(slug);
        const career = draftCareerRecord(slug);
        const homeland = c.g.flatMap(([, entries]) => Array.isArray(entries) ? entries.flatMap((entry) => {
          if (!Array.isArray(entry) || typeof entry[0] !== "string") return [];
          const found = draftCareerRecord(figureSlug(entry[0]));
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
          ...(career ? { ...applyCareerEvidence(slug, careerRatings(career, { archetype: archetypeValue, primaryNote: note })), fame: fameRating(career, RECORDS, homeland) } : {}),
        };
      }),
    };
  }),
}));

// New country-choice boards cannot be replayed as the old five-country model.
export const POOL_VERSION = draftPool.v + 3;
