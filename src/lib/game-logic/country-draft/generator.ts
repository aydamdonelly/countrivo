/*
 * The board generator. Pure and seeded: the same seed produces the same five rounds, the
 * same fifteen people and the same ceiling on the server, in the browser and in the
 * validator. It consumes the RNG in the order written below, and nothing here may be
 * reordered without bumping POOL_VERSION.
 */
import { seededShuffle } from "@/lib/seeded-random";
import { POOL, type PoolCountry } from "./roster";
import { bestLine, greedyLine } from "./scoring";
import { GEN_ATTEMPTS, MAX_CEILING, MIN_CEILING, MIN_GREEDY_GAP, ROUNDS } from "./tables";
import type { DraftBoard, DraftFigure, DraftRound } from "./types";

/** The five archetypes that are the natural fit of a seat. */
const NATURAL_ARCHETYPES = [0, 1, 2, 3, 4];
/** A board must be able to fill at least this many seats naturally, somewhere. */
const MIN_NATURALS_OFFERED = 4;

/** The index triples of a country's archetype groups, in a fixed order. */
function tripleIndexes(n: number): number[][] {
  const out: number[][] = [];
  for (let a = 0; a < n; a += 1)
    for (let b = a + 1; b < n; b += 1)
      for (let c = b + 1; c < n; c += 1) out.push([a, b, c]);
  return out;
}

/**
 * One round: three people from one country, three different archetypes, and never three
 * identical standings (that would make the pick a coin toss). Returns null only if the
 * country cannot manage it, which build-draft-pool.mjs already rules out.
 */
function drawRound(country: PoolCountry, rng: () => number): DraftRound | null {
  for (const triple of seededShuffle(tripleIndexes(country.groups.length), rng)) {
    const pool: DraftFigure[] = triple.map((g) => {
      const people = country.groups[g].people;
      return people[Math.floor(rng() * people.length)];
    });
    if (new Set(pool.map((p) => p.standing)).size > 1) {
      return { iso3: country.iso3, iso2: country.iso2, name: country.name, region: country.region, pool };
    }
  }
  return null;
}

interface Attempt {
  rounds: DraftRound[];
  ceiling: number;
  best: DraftBoard["best"];
  quality: number;
}

/**
 * How good an attempt is, as one integer, so the generator's choice is total and
 * deterministic. The flags are ordered by how much the board would suffer without them:
 * a cabinet drawn from one continent is the worst outcome, a par that is out of the usual
 * band is the mildest.
 */
function qualityOf(spread: boolean, naturals: boolean, underMax: boolean, overMin: boolean, gap: number, ceiling: number): number {
  return (
    (spread ? 1 : 0) * 1_000_000 +
    (naturals ? 1 : 0) * 500_000 +
    (underMax ? 1 : 0) * 200_000 +
    (overMin ? 1 : 0) * 100_000 +
    Math.min(gap, MIN_GREEDY_GAP) * 1_000 +
    ceiling
  );
}

/**
 * Five countries, five categories of decision, one par. The loop keeps the best attempt it
 * has seen rather than the last, so an early good board is never thrown away, and stops as
 * soon as an attempt clears every condition (94 % of boards inside a handful of tries).
 */
export function createBoard(rng: () => number): DraftBoard {
  let best: Attempt | null = null;

  for (let attempt = 0; attempt < GEN_ATTEMPTS; attempt += 1) {
    const rounds: DraftRound[] = [];
    for (const country of seededShuffle([...POOL], rng)) {
      if (rounds.length === ROUNDS) break;
      const round = drawRound(country, rng);
      if (round) rounds.push(round);
    }
    if (rounds.length < ROUNDS) continue;

    const line = bestLine(rounds);
    const ceiling = line.score;
    const offered = new Set(rounds.flatMap((r) => r.pool.map((p) => p.archetype)));
    const spread = new Set(rounds.map((r) => continentOf(r.iso3))).size >= 3;
    const naturals = NATURAL_ARCHETYPES.filter((a) => offered.has(a)).length >= MIN_NATURALS_OFFERED;
    const underMax = ceiling <= MAX_CEILING;
    const overMin = ceiling >= MIN_CEILING;
    const gap = ceiling - greedyLine(rounds).score;
    const quality = qualityOf(spread, naturals, underMax, overMin, gap, ceiling);

    if (!best || quality > best.quality) best = { rounds, ceiling, best: line.picks, quality };
    if (spread && naturals && underMax && overMin && gap >= MIN_GREEDY_GAP) break;
  }

  // POOL holds 51 countries, every one of which can field a round, so the first attempt
  // always produces five: `best` is never null. The throw is a contract, not a branch a
  // player can reach.
  if (!best) throw new Error("country-draft: the roster produced no board");
  return { rounds: best.rounds, ceiling: best.ceiling, best: best.best };
}

const CONTINENT_OF = new Map(POOL.map((c) => [c.iso3, c.continent]));

function continentOf(iso3: string): number {
  return CONTINENT_OF.get(iso3) ?? -1;
}
