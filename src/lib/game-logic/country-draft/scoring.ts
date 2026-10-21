import { safeCareerLine } from "./career-ratings";
import { BONUS_POINTS, FIT, ROUNDS, STANDING_POINTS, bandOf } from "./tables";
import type { DraftBonuses, DraftFigure, DraftPick, DraftRound, DraftScore, PoolIdx, SeatIdx } from "./types";

// Crossover careers are scored for the person, rather than flattened into a headline role.
const CROSSOVER_FITS: Readonly<Record<string, readonly number[]>> = {
  "charles-de-gaulle": [25, 25, 12, 18, 18],
  "winston-churchill": [25, 18, 12, 18, 12],
  "dwight-d-eisenhower": [25, 25, 12, 12, 12],
  "benjamin-franklin": [18, 6, 18, 18, 25],
  "julius-caesar": [25, 25, 12, 18, 18],
  "mahatma-gandhi": [25, 6, 6, 25, 12],
  "jose-marti": [18, 6, 6, 25, 12],
  "wangari-maathai": [18, 6, 12, 18, 25],
  "vaclav-havel": [25, 6, 6, 25, 18],
  "coco-chanel": [12, 0, 18, 18, 25],
  "aliko-dangote": [12, 0, 25, 6, 18],
};

export function fitOf(archetype: number, seat: SeatIdx): number {
  return FIT[archetype]?.[seat] ?? 0;
}

export function figureFit(figure: DraftFigure, seat: SeatIdx): number {
  return figure.fits?.[seat] ?? CROSSOVER_FITS[figure.slug]?.[seat] ?? fitOf(figure.archetype, seat);
}

export function standingPointsOf(standing: number): number {
  return Math.max(4, STANDING_POINTS[standing] ?? 4);
}
export function fameOf(figure: DraftFigure): number { return figure.fame ?? standingPointsOf(figure.standing); }

export function pointsOf(figure: DraftFigure, seat: SeatIdx): number {
  return figureFit(figure, seat) + fameOf(figure);
}

export function makePick(round: number, countryIdx: PoolIdx, seat: SeatIdx, poolIdx: PoolIdx, figure: DraftFigure, region: string): DraftPick {
  const fit = figureFit(figure, seat);
  const standingPoints = fameOf(figure);
  return { round, countryIdx, seat, poolIdx, region, era: figure.era, fit, standingPoints, points: fit + standingPoints };
}

export function bonusesOf(picks: readonly DraftPick[]): DraftBonuses {
  return {
    fullCabinet: picks.length === ROUNDS && picks.every((p) => p.fit >= 12),
    threeRegions: new Set(picks.map((p) => p.region)).size >= 3,
    acrossAges: picks.some((p) => p.era === "early") && picks.some((p) => p.era === "recent"),
  };
}

export function bonusTotalOf(b: DraftBonuses): number {
  return (b.fullCabinet ? BONUS_POINTS.fullCabinet : 0) + (b.threeRegions ? BONUS_POINTS.threeRegions : 0) + (b.acrossAges ? BONUS_POINTS.acrossAges : 0);
}

export function scoreOf(picks: readonly DraftPick[]): DraftScore {
  const fitTotal = picks.reduce((n, p) => n + p.fit, 0);
  const standingTotal = picks.reduce((n, p) => n + p.standingPoints, 0);
  const bonuses = picks.length === ROUNDS ? bonusesOf(picks) : { fullCabinet: false, threeRegions: false, acrossAges: false };
  const bonusTotal = bonusTotalOf(bonuses);
  return { fitTotal, standingTotal, bonusTotal, bonuses, score: fitTotal + standingTotal + bonusTotal };
}

export function bandWordOf(score: number): string {
  return bandOf(score).word;
}

export interface DraftLine {
  score: number;
  picks: DraftPick[];
}

interface SearchNode {
  seats: number;
  regions: number;
  eras: number;
  plausible: boolean;
  base: number;
  picks: DraftPick[];
}

const SEATS: readonly SeatIdx[] = [0, 1, 2, 3, 4];
const INDICES: readonly PoolIdx[] = [0, 1, 2];

/** Dynamic programming includes country paths, all five jobs and the whole-cabinet bonuses. */
export function bestLine(rounds: readonly DraftRound[]): DraftLine {
  const regionNames = [...new Set(rounds.flatMap((r) => r.countries.map((c) => c.region)))];
  let layer: SearchNode[] = [{ seats: 0, regions: 0, eras: 0, plausible: true, base: 0, picks: [] }];
  rounds.forEach((round, roundIdx) => {
    const next = new Map<number, SearchNode>();
    for (const node of layer) {
      for (const countryIdx of INDICES) {
        const country = round.countries[countryIdx];
        if (!country) continue;
        for (const poolIdx of INDICES) {
          const figure = country.pool[poolIdx];
          if (!figure) continue;
          for (const seat of SEATS) {
            if (node.seats & (1 << seat)) continue;
            const pick = makePick(roundIdx, countryIdx, seat, poolIdx, figure, country.region);
            const seats = node.seats | (1 << seat);
            const regions = node.regions | (1 << regionNames.indexOf(country.region));
            const eras = node.eras | (figure.era === "early" ? 1 : figure.era === "recent" ? 2 : 0);
            const plausible = node.plausible && pick.fit >= 12;
            const base = node.base + pick.points;
            const key = seats | (regions << 5) | (eras << 10) | (plausible ? 1 << 12 : 0);
            const previous = next.get(key);
            if (!previous || base > previous.base) next.set(key, { seats, regions, eras, plausible, base, picks: [...node.picks, pick] });
          }
        }
      }
    }
    layer = [...next.values()];
  });
  let best: DraftLine = { score: -1, picks: [] };
  for (const node of layer) {
    const score = scoreOf(node.picks).score;
    if (score > best.score) best = { score, picks: node.picks };
  }
  return best;
}

export function greedyLine(rounds: readonly DraftRound[]): DraftLine {
  const picks: DraftPick[] = [];
  const used = new Set<SeatIdx>();
  rounds.forEach((round, roundIdx) => {
    let best: DraftPick | null = null;
    for (const countryIdx of INDICES) for (const poolIdx of INDICES) for (const seat of SEATS) {
      const country = round.countries[countryIdx];
      const figure = country?.pool[poolIdx];
      if (!figure || used.has(seat)) continue;
      const pick = makePick(roundIdx, countryIdx, seat, poolIdx, figure, country.region);
      if (!best || pick.points > best.points) best = pick;
    }
    if (best) { picks.push(best); used.add(best.seat); }
  });
  return { picks, score: scoreOf(picks).score };
}

export function whyLine(figure: DraftFigure, seat: SeatIdx, fit: number): string {
  if (figure.fitEvidence?.[seat]) return safeCareerLine(figure.fitEvidence[seat].line, seat);
  const career = `${figure.note.charAt(0).toUpperCase()}${figure.note.slice(1)}`;
  const reasons = ["leadership", "military command", "finance", "public communication", "science, invention and exploration"];
  if (fit === 0) return `${career}. That career does not match ${reasons[seat]}.`;
  if (fit <= 6) return `${career}. There is only a thin connection to ${reasons[seat]}.`;
  if (fit === 25) return `${career}. Their recorded career is a natural match for ${reasons[seat]}.`;
  return `${career}. Their experience also connects to ${reasons[seat]}.`;
}

export function whySource(figure: DraftFigure, seat: SeatIdx): string { return figure.fitEvidence?.[seat]?.source ?? figure.biography; }
