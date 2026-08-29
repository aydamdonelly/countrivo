/*
 * Country Draft scoring. Integer arithmetic, no rounding, no normalisation, nothing
 * random: `appointment = FIT[archetype][seat] + STANDING_POINTS[standing]`, five of them,
 * plus up to twenty points of bonus, out of 195.
 */
import { BONUS_POINTS, FIT, POOL_SIZE, ROUNDS, STANDING_POINTS, bandOf } from "./tables";
import type { DraftBonuses, DraftFigure, DraftPick, DraftRound, DraftScore, PoolIdx, SeatIdx } from "./types";

export function fitOf(archetype: number, seat: SeatIdx): number {
  return FIT[archetype][seat];
}

export function standingPointsOf(standing: number): number {
  return STANDING_POINTS[standing] ?? 0;
}

export function pointsOf(figure: DraftFigure, seat: SeatIdx): number {
  return fitOf(figure.archetype, seat) + standingPointsOf(figure.standing);
}

export function makePick(round: number, seat: SeatIdx, poolIdx: PoolIdx, figure: DraftFigure): DraftPick {
  const fit = fitOf(figure.archetype, seat);
  const standingPoints = standingPointsOf(figure.standing);
  return { round, seat, poolIdx, fit, standingPoints, points: fit + standingPoints };
}

/** The three bonuses, recomputed from the appointments and the people who filled them. */
export function bonusesOf(picks: readonly DraftPick[], standings: readonly number[]): DraftBonuses {
  const fullCabinet = picks.length === ROUNDS && picks.every((p) => p.fit >= 12);
  const threeNaturals = picks.filter((p) => p.fit === 25).length >= 3;
  const top = standings.length ? Math.max(...standings) : 0;
  const rightHand = picks.some((p, i) => standings[i] === top && p.fit === 25);
  return { fullCabinet, rightHand, threeNaturals };
}

export function bonusTotalOf(b: DraftBonuses): number {
  return (
    (b.fullCabinet ? BONUS_POINTS.fullCabinet : 0) +
    (b.rightHand ? BONUS_POINTS.rightHand : 0) +
    (b.threeNaturals ? BONUS_POINTS.threeNaturals : 0)
  );
}

/**
 * The whole score. Bonuses are only awarded on a finished cabinet, so the running total a
 * player watches while they play is the honest base and the bonus arrives at the end.
 */
export function scoreOf(picks: readonly DraftPick[], standings: readonly number[]): DraftScore {
  const fitTotal = picks.reduce((n, p) => n + p.fit, 0);
  const standingTotal = picks.reduce((n, p) => n + p.standingPoints, 0);
  const complete = picks.length === ROUNDS;
  const bonuses = complete ? bonusesOf(picks, standings) : { fullCabinet: false, rightHand: false, threeNaturals: false };
  const bonusTotal = bonusTotalOf(bonuses);
  return { fitTotal, standingTotal, bonusTotal, bonuses, score: fitTotal + standingTotal + bonusTotal };
}

export function bandWordOf(score: number): string {
  return bandOf(score).word;
}

/** Every ordering of the five seats, flattened into one Int32Array of 120 x 5. */
const PERMS = (() => {
  const rows: number[][] = [];
  const walk = (cur: number[], left: number[]) => {
    if (left.length === 0) {
      rows.push(cur);
      return;
    }
    for (const s of left) walk([...cur, s], left.filter((x) => x !== s));
  };
  walk([], [0, 1, 2, 3, 4]);
  return Int32Array.from(rows.flat());
})();
const PERM_COUNT = PERMS.length / ROUNDS;

/** The 243 ways to take one of three people per round, flattened as pool indexes. */
const COMBOS = (() => {
  const total = POOL_SIZE ** ROUNDS;
  const out = new Int32Array(total * ROUNDS);
  for (let m = 0; m < total; m += 1) {
    let x = m;
    for (let r = 0; r < ROUNDS; r += 1) {
      out[m * ROUNDS + r] = x % POOL_SIZE;
      x = (x - (x % POOL_SIZE)) / POOL_SIZE;
    }
  }
  return out;
})();
const MAX_BONUS_SUM = BONUS_POINTS.fullCabinet + BONUS_POINTS.rightHand + BONUS_POINTS.threeNaturals;

export interface DraftLine {
  score: number;
  picks: DraftPick[];
}

/**
 * The best line the board allows: one of three people per round into one of the five
 * seats. 3^5 x 5! = 29 160 cabinets, each scored in full including the bonuses, which is
 * why this is a brute force and not an assignment solver: the bonuses depend on the whole
 * cabinet, so no per-seat cost matrix can express them.
 *
 * It runs on every board creation, on the server and again in the browser, so the search
 * itself allocates nothing: the fits, the standings and the permutations are flattened
 * into typed arrays up front and the inner loop is integer arithmetic. The winning
 * cabinet is the only one turned back into objects.
 */
export function bestLine(rounds: readonly DraftRound[]): DraftLine {
  const n = ROUNDS * POOL_SIZE;
  const fits = new Int32Array(n * ROUNDS);
  const stand = new Int32Array(n);
  const sPts = new Int32Array(n);
  for (let r = 0; r < ROUNDS; r += 1) {
    for (let c = 0; c < POOL_SIZE; c += 1) {
      const figure = rounds[r].pool[c];
      const row = FIT[figure.archetype];
      for (let seat = 0; seat < ROUNDS; seat += 1) fits[(r * POOL_SIZE + c) * ROUNDS + seat] = row[seat];
      stand[r * POOL_SIZE + c] = figure.standing;
      sPts[r * POOL_SIZE + c] = STANDING_POINTS[figure.standing] ?? 0;
    }
  }

  const rowMax = new Int32Array(n);
  for (let c = 0; c < n; c += 1) {
    let m = 0;
    for (let seat = 0; seat < ROUNDS; seat += 1) if (fits[c * ROUNDS + seat] > m) m = fits[c * ROUNDS + seat];
    rowMax[c] = m;
  }

  const chosen = new Int32Array(ROUNDS);
  const isTop = new Int32Array(ROUNDS);
  let bestScore = -1;
  let bestPerm = 0;
  const bestChoice = new Int32Array(ROUNDS);

  const comboCount = POOL_SIZE ** ROUNDS;
  for (let m = 0; m < comboCount; m += 1) {
    let sPtsSum = 0;
    let top = 0;
    let bound = 0;
    for (let r = 0; r < ROUNDS; r += 1) {
      const c = r * POOL_SIZE + COMBOS[m * ROUNDS + r];
      chosen[r] = c;
      sPtsSum += sPts[c];
      bound += rowMax[c];
      if (stand[c] > top) top = stand[c];
    }
    // Nobody can beat every seat's own best fit plus every bonus, so a combo that cannot
    // reach the leader even at that bound is skipped whole, permutations and all.
    if (bound + sPtsSum + MAX_BONUS_SUM <= bestScore) continue;
    for (let r = 0; r < ROUNDS; r += 1) isTop[r] = stand[chosen[r]] === top ? 1 : 0;

    for (let p = 0; p < PERM_COUNT; p += 1) {
      const base = p * ROUNDS;
      let fitSum = 0;
      let naturals = 0;
      let full = 1;
      let rightHand = 0;
      for (let r = 0; r < ROUNDS; r += 1) {
        const f = fits[chosen[r] * ROUNDS + PERMS[base + r]];
        fitSum += f;
        if (f === 25) {
          naturals += 1;
          if (isTop[r] === 1) rightHand = 1;
        } else if (f < 12) {
          full = 0;
        }
      }
      const total =
        fitSum +
        sPtsSum +
        (full === 1 ? BONUS_POINTS.fullCabinet : 0) +
        (rightHand === 1 ? BONUS_POINTS.rightHand : 0) +
        (naturals >= 3 ? BONUS_POINTS.threeNaturals : 0);
      if (total > bestScore) {
        bestScore = total;
        bestPerm = p;
        bestChoice.set(chosen);
      }
    }
  }

  const picks: DraftPick[] = [];
  for (let r = 0; r < ROUNDS; r += 1) {
    const poolIdx = (bestChoice[r] - r * POOL_SIZE) as PoolIdx;
    picks.push(makePick(r, PERMS[bestPerm * ROUNDS + r] as SeatIdx, poolIdx, rounds[r].pool[poolIdx]));
  }
  return { score: bestScore, picks };
}

/**
 * The line a player takes when they always bank the biggest number in front of them: for
 * each round in order, the (person, open seat) pair worth the most right now, ties going
 * to the earlier person and then the earlier seat. It is the reference the generator
 * measures a board against, because a board where greed is nearly optimal is a board with
 * no decision in it.
 */
export function greedyLine(rounds: readonly DraftRound[]): DraftLine {
  const open: SeatIdx[] = [0, 1, 2, 3, 4];
  const picks: DraftPick[] = [];
  const standings: number[] = [];
  rounds.forEach((round, i) => {
    let bestValue = -1;
    let bestPool: PoolIdx = 0;
    let bestSeat: SeatIdx = open[0];
    round.pool.forEach((figure, p) => {
      for (const seat of open) {
        const value = pointsOf(figure, seat);
        if (value > bestValue) {
          bestValue = value;
          bestPool = p as PoolIdx;
          bestSeat = seat;
        }
      }
    });
    picks.push(makePick(i, bestSeat, bestPool, round.pool[bestPool]));
    standings.push(round.pool[bestPool].standing);
    open.splice(open.indexOf(bestSeat), 1);
  });
  return { score: scoreOf(picks, standings).score, picks };
}
