import { countries } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededShuffle } from "@/lib/seeded-random";
import type { Country } from "@/types/country";

const stats: Record<string, Record<string, number | null>> = statsData;

export type ClusterTraitKind =
  | "continent"
  | "subregion"
  | "firstLetter"
  | "island"
  | "manyBorders"
  | "statTop"
  | "statBottom";

export interface ClusterGroup {
  id: number; // 0..3, canonical index = color slot, ordered easiest→trickiest
  trait: string; // short label shown on solve, e.g. "Western Africa"
  traitKind: ClusterTraitKind;
  members: string[]; // 4 iso3 codes
  difficulty: number; // 0=easiest .. 3=trickiest
}

export interface ClusterTile {
  iso3: string;
  displayName: string;
  flagEmoji: string;
}

export interface ClusterState {
  tiles: ClusterTile[]; // 16 tiles in stable seeded display order
  groups: ClusterGroup[]; // 4 groups, sorted by difficulty asc
  selected: string[]; // iso3 currently selected (max 4)
  solvedGroupIds: number[]; // group ids the PLAYER solved, in order
  guesses: string[][]; // every submitted quartet (iso3[]), in order
  mistakes: number; // 0..4
  phase: "playing" | "won" | "lost";
}

export const CLUSTER_MAX_MISTAKES = 4;
export const CLUSTER_GROUP_COUNT = 4;
export const CLUSTER_GROUP_SIZE = 4;

// A built group carries a predicate closure used ONLY at generation time for the
// uniqueness check. It is dropped before the (serializable) ClusterGroup is stored.
interface BuiltGroup {
  trait: string;
  traitKind: ClusterTraitKind;
  members: string[];
  difficulty: number;
  predicate: (c: Country) => boolean;
}

const pool = countries.filter((c) => c.flagEmoji && c.flagEmoji.trim().length > 0);
const byIso3 = new Map(countries.map((c) => [c.iso3, c]));

const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
const STAT_LABELS: Record<string, string> = {
  population: "population",
  "area-km2": "area",
  gdp: "GDP",
  "gdp-per-capita": "GDP per capita",
};
const STAT_SLUGS = Object.keys(STAT_LABELS);

function statVal(iso3: string, slug: string): number | null {
  const v = stats[iso3]?.[slug];
  return typeof v === "number" ? v : null;
}

function pick4(arr: Country[], rng: () => number): Country[] | null {
  if (arr.length < 4) return null;
  return seededShuffle(arr, rng).slice(0, 4);
}

type Builder = (rng: () => number, exclude: Set<string>) => BuiltGroup | null;

const continentBuilder: Builder = (rng, exclude) => {
  for (const cont of seededShuffle(CONTINENTS, rng)) {
    const four = pick4(pool.filter((c) => c.continent === cont && !exclude.has(c.iso3)), rng);
    if (four) {
      return { trait: cont, traitKind: "continent", members: four.map((c) => c.iso3), difficulty: 0, predicate: (c) => c.continent === cont };
    }
  }
  return null;
};

const subregionBuilder: Builder = (rng, exclude) => {
  const subs = seededShuffle([...new Set(pool.map((c) => c.subregion))].filter(Boolean), rng);
  for (const sub of subs) {
    const four = pick4(pool.filter((c) => c.subregion === sub && !exclude.has(c.iso3)), rng);
    if (four) {
      return { trait: sub, traitKind: "subregion", members: four.map((c) => c.iso3), difficulty: 1, predicate: (c) => c.subregion === sub };
    }
  }
  return null;
};

const firstLetterBuilder: Builder = (rng, exclude) => {
  for (const letter of seededShuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), rng)) {
    const four = pick4(pool.filter((c) => c.displayName[0] === letter && !exclude.has(c.iso3)), rng);
    if (four) {
      return { trait: `Starts with "${letter}"`, traitKind: "firstLetter", members: four.map((c) => c.iso3), difficulty: 2, predicate: (c) => c.displayName[0] === letter };
    }
  }
  return null;
};

const islandBuilder: Builder = (rng, exclude) => {
  const four = pick4(pool.filter((c) => c.borders.length === 0 && !exclude.has(c.iso3)), rng);
  if (four) {
    return { trait: "Island nations", traitKind: "island", members: four.map((c) => c.iso3), difficulty: 1, predicate: (c) => c.borders.length === 0 };
  }
  return null;
};

const manyBordersBuilder: Builder = (rng, exclude) => {
  const four = pick4(pool.filter((c) => c.borders.length >= 5 && !exclude.has(c.iso3)), rng);
  if (four) {
    return { trait: "Borders 5+ countries", traitKind: "manyBorders", members: four.map((c) => c.iso3), difficulty: 2, predicate: (c) => c.borders.length >= 5 };
  }
  return null;
};

function statBuilder(kind: "statTop" | "statBottom"): Builder {
  return (rng, exclude) => {
    for (const slug of seededShuffle(STAT_SLUGS, rng)) {
      const ranked = pool
        .map((c) => ({ c, v: statVal(c.iso3, slug) }))
        .filter((x): x is { c: Country; v: number } => x.v !== null && x.v > 0)
        .sort((a, b) => (kind === "statTop" ? b.v - a.v : a.v - b.v));
      if (ranked.length < 12) continue;
      const band = ranked.slice(0, 12);
      const bandSet = new Set(band.map((x) => x.c.iso3));
      const four = pick4(band.filter((x) => !exclude.has(x.c.iso3)).map((x) => x.c), rng);
      if (four) {
        const label = STAT_LABELS[slug];
        return {
          trait: kind === "statTop" ? `Top ${label}` : `Lowest ${label}`,
          traitKind: kind,
          members: four.map((c) => c.iso3),
          difficulty: 3,
          predicate: (c) => bandSet.has(c.iso3),
        };
      }
    }
    return null;
  };
}

const BUILDERS: { kind: ClusterTraitKind; build: Builder }[] = [
  { kind: "continent", build: continentBuilder },
  { kind: "subregion", build: subregionBuilder },
  { kind: "firstLetter", build: firstLetterBuilder },
  { kind: "island", build: islandBuilder },
  { kind: "manyBorders", build: manyBordersBuilder },
  { kind: "statTop", build: statBuilder("statTop") },
  { kind: "statBottom", build: statBuilder("statBottom") },
];

// 4 distinct trait kinds, never continent + subregion together (subregion ⊂ continent).
function chooseKinds(rng: () => number): typeof BUILDERS | null {
  const chosen: typeof BUILDERS = [];
  const kinds = new Set<string>();
  for (const b of seededShuffle(BUILDERS, rng)) {
    if (kinds.has(b.kind)) continue;
    if (b.kind === "subregion" && kinds.has("continent")) continue;
    if (b.kind === "continent" && kinds.has("subregion")) continue;
    chosen.push(b);
    kinds.add(b.kind);
    if (chosen.length === 4) break;
  }
  return chosen.length === 4 ? chosen : null;
}

function finalize(built: BuiltGroup[], rng: () => number): ClusterState {
  // Stable, locale-independent sort: difficulty asc, then trait string.
  const sorted = [...built].sort(
    (a, b) => a.difficulty - b.difficulty || (a.trait < b.trait ? -1 : a.trait > b.trait ? 1 : 0),
  );
  const groups: ClusterGroup[] = sorted.map((g, i) => ({
    id: i,
    trait: g.trait,
    traitKind: g.traitKind,
    members: g.members,
    difficulty: g.difficulty,
  }));
  const memberCountries = groups
    .flatMap((g) => g.members)
    .map((iso) => byIso3.get(iso))
    .filter((c): c is Country => c != null);
  const tiles: ClusterTile[] = seededShuffle(memberCountries, rng).map((c) => ({
    iso3: c.iso3,
    displayName: c.displayName,
    flagEmoji: c.flagEmoji,
  }));
  return { tiles, groups, selected: [], solvedGroupIds: [], guesses: [], mistakes: 0, phase: "playing" };
}

export function createCluster(rng: () => number): ClusterState {
  for (let attempt = 0; attempt < 200; attempt++) {
    const chosen = chooseKinds(rng);
    if (!chosen) continue;
    const exclude = new Set<string>();
    const built: BuiltGroup[] = [];
    let ok = true;
    for (const b of chosen) {
      const g = b.build(rng, exclude);
      if (!g) {
        ok = false;
        break;
      }
      g.members.forEach((iso) => exclude.add(iso));
      built.push(g);
    }
    if (!ok || built.length !== 4) continue;

    // Uniqueness: no member of one group may satisfy another group's predicate,
    // otherwise the puzzle is ambiguous.
    let unique = true;
    outer: for (let gi = 0; gi < built.length; gi++) {
      for (const iso of built[gi].members) {
        const c = byIso3.get(iso);
        if (!c) {
          unique = false;
          break outer;
        }
        for (let gj = 0; gj < built.length; gj++) {
          if (gj === gi) continue;
          if (built[gj].predicate(c)) {
            unique = false;
            break outer;
          }
        }
      }
    }
    if (!unique) continue;
    return finalize(built, rng);
  }

  // Fallback (statistically never reached): four rarely-colliding kinds, disjoint.
  const exclude = new Set<string>();
  const fb: BuiltGroup[] = [];
  for (const build of [continentBuilder, firstLetterBuilder, islandBuilder, manyBordersBuilder]) {
    const g = build(rng, exclude);
    if (g) {
      g.members.forEach((iso) => exclude.add(iso));
      fb.push(g);
    }
  }
  return finalize(fb, rng);
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((x) => bs.has(x));
}

export function toggleTile(state: ClusterState, iso3: string): ClusterState {
  if (state.phase !== "playing") return state;
  const solved = new Set(
    state.solvedGroupIds.flatMap((id) => state.groups.find((g) => g.id === id)?.members ?? []),
  );
  if (solved.has(iso3)) return state;
  if (state.selected.includes(iso3)) {
    return { ...state, selected: state.selected.filter((x) => x !== iso3) };
  }
  if (state.selected.length >= CLUSTER_GROUP_SIZE) return state;
  return { ...state, selected: [...state.selected, iso3] };
}

/** The unsolved group exactly matching the current 4-selection, or null. */
export function matchedGroup(state: ClusterState): ClusterGroup | null {
  if (state.selected.length !== CLUSTER_GROUP_SIZE) return null;
  return (
    state.groups.find(
      (g) => !state.solvedGroupIds.includes(g.id) && setsEqual(g.members, state.selected),
    ) ?? null
  );
}

/** True when exactly 3 of the 4 selected share a single unsolved group ("one away"). */
export function isOneAway(state: ClusterState): boolean {
  if (state.selected.length !== CLUSTER_GROUP_SIZE) return false;
  return state.groups.some(
    (g) =>
      !state.solvedGroupIds.includes(g.id) &&
      state.selected.filter((iso) => g.members.includes(iso)).length === 3,
  );
}

export function submitGuess(state: ClusterState): ClusterState {
  if (state.phase !== "playing" || state.selected.length !== CLUSTER_GROUP_SIZE) return state;
  const guesses = [...state.guesses, [...state.selected]];
  const match = matchedGroup(state);
  if (match) {
    const solvedGroupIds = [...state.solvedGroupIds, match.id];
    const phase = solvedGroupIds.length === CLUSTER_GROUP_COUNT ? "won" : "playing";
    return { ...state, selected: [], solvedGroupIds, guesses, phase };
  }
  const mistakes = state.mistakes + 1;
  const phase = mistakes >= CLUSTER_MAX_MISTAKES ? "lost" : "playing";
  return { ...state, selected: [], mistakes, guesses, phase };
}

export function clusterScore(state: ClusterState): number {
  return state.solvedGroupIds.length;
}

/** The solved group id containing this tile, or null (board colors solved tiles). */
export function isTileSolved(state: ClusterState, iso3: string): number | null {
  for (const id of state.solvedGroupIds) {
    const g = state.groups.find((gg) => gg.id === id);
    if (g && g.members.includes(iso3)) return id;
  }
  return null;
}
