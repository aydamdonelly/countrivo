/*
 * The draft roster, read once from src/data/draft-pool.json (built by
 * scripts/build-draft-pool.mjs from src/data/figures.json). Only countries that can field
 * three different archetypes are in the file, so the generator never searches at runtime.
 *
 * The file is 33 KB and ships to the browser on purpose: the board is rebuilt from the
 * seed alone on the client so a resumed run and the server HTML agree exactly, which is
 * the whole reason there is no loading state on the play route.
 */
import pool from "@/data/draft-pool.json";
import PORTRAIT_SLUGS from "@/data/portrait-slugs.json";
import type { DraftFigure } from "./types";

interface RawCountry {
  c: string;
  i: string;
  n: string;
  r: string;
  t: number;
  g: [number, [string, number, string][]][];
}

const RAW = pool as { v: number; a: string[]; t: string[]; p: RawCountry[] };

export interface PoolGroup {
  archetype: number;
  people: readonly DraftFigure[];
}

export interface PoolCountry {
  iso3: string;
  iso2: string;
  name: string;
  /** `Americas · South America`, the line under the country on the board. */
  region: string;
  /** Index into CONTINENTS; the generator spreads a board across at least three. */
  continent: number;
  groups: readonly PoolGroup[];
}

/**
 * The slug rule, shared with scripts/fetch-portraits.ts: strip accents, lowercase, and
 * join on hyphens. It is the file name of the portrait, so the two must never disagree.
 */
export function figureSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PORTRAITS = new Set<string>(PORTRAIT_SLUGS as string[]);

export const CONTINENTS: readonly string[] = RAW.t;

export const POOL: readonly PoolCountry[] = RAW.p.map((c) => ({
  iso3: c.c,
  iso2: c.i,
  name: c.n,
  region: c.r,
  continent: c.t,
  groups: c.g.map(([archetype, people]) => ({
    archetype,
    people: people.map(([name, standing, note]) => {
      const slug = figureSlug(name);
      return { name, slug, portrait: PORTRAITS.has(slug), note, archetype, standing };
    }),
  })),
}));

/**
 * The roster version, read from the data file itself so it can never drift from the
 * roster it describes. It is stamped into every payload, so a run submitted from a client
 * that still holds yesterday's roster is detectable and handled rather than thrown away
 * (src/lib/game-logic/country-draft/server-validate.ts).
 */
export const POOL_VERSION = RAW.v;
