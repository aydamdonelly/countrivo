import { seededShuffle } from "@/lib/seeded-random";
import { POOL, type PoolCountry } from "./roster";
import { bestLine } from "./scoring";
import { ROUNDS } from "./tables";
import type { DraftBoard, DraftCountry, DraftFigure, DraftRound } from "./types";

function drawCountry(country: PoolCountry, rng: () => number): DraftCountry | null {
  const groups = seededShuffle(country.groups.filter((g) => g.people.some((p) => p.portrait)), rng).slice(0, 3);
  if (groups.length !== 3) return null;
  const pool: DraftFigure[] = groups.map((group) => {
    const people = group.people.filter((p) => p.portrait);
    return people[Math.floor(rng() * people.length)];
  });
  return { iso3: country.iso3, iso2: country.iso2, name: country.name, region: country.region.split(" · ")[0], pool: seededShuffle(pool, rng) };
}

/** Fifteen different homelands. Each set of three crosses at least two world regions. */
export interface DraftBoardOptions { excludeCountries?: readonly string[]; firstCountry?: string; }

export function createBoard(rng: () => number, options: DraftBoardOptions = {}): DraftBoard {
  const excluded = new Set(options.excludeCountries ?? []);
  const eligible = POOL.filter((c) => !excluded.has(c.iso3) && c.groups.filter((g) => g.people.some((p) => p.portrait)).length >= 3);
  if (eligible.length < 15) throw new Error("Not enough countries remain for a practice draft.");
  let fallback: DraftBoard | null = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const available = seededShuffle(eligible, rng);
    if (options.firstCountry) {
      const first = available.findIndex((country) => country.iso3 === options.firstCountry);
      if (first >= 0) available.unshift(...available.splice(first, 1));
    }
    const rounds: DraftRound[] = [];
    while (rounds.length < ROUNDS && available.length >= 3) {
      const first = available.shift();
      if (!first) break;
      const otherIndex = available.findIndex((c) => c.continent !== first.continent);
      if (otherIndex < 0) break;
      const second = available.splice(otherIndex, 1)[0];
      const third = available.shift();
      if (!third) break;
      const countries = seededShuffle([first, second, third], rng).map((c) => drawCountry(c, rng)).filter((c): c is DraftCountry => c !== null);
      if (countries.length === 3) rounds.push({ countries });
    }
    if (rounds.length !== ROUNDS) continue;
    const best = bestLine(rounds);
    const board = { rounds, ceiling: best.score, best: best.picks };
    if (!fallback || board.ceiling > fallback.ceiling) fallback = board;
    const figures = rounds.flatMap((r) => r.countries.flatMap((c) => c.pool));
    if (best.score >= 165 && figures.some((f) => f.era === "early") && figures.some((f) => f.era === "recent")) return board;
  }
  if (!fallback) throw new Error("Country Draft needs fifteen portrait-ready countries across multiple regions.");
  return fallback;
}
