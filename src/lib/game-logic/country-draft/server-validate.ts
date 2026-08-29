/*
 * Country Draft server validation (SPEC 21.2). The daily board is deterministic, so the
 * server regenerates it from (dateKey + edition) and checks the submitted cabinet against
 * the real people, the real fits and the real ceiling. Nothing in the payload is trusted
 * except as a claim to be re-derived.
 */
import { dateSeed } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { createBoard } from "./generator";
import { bonusTotalOf, bonusesOf, fitOf, standingPointsOf } from "./scoring";
import { FIT, MAX_BASE, MAX_BONUS, MAX_CEILING, MAX_SCORE, ROUNDS, STANDING_POINTS, bandOf } from "./tables";
import { POOL_VERSION } from "./roster";
import type { SeatIdx } from "./types";

interface SubmittedPick {
  round?: unknown;
  seat?: unknown;
  name?: unknown;
  standing?: unknown;
  fit?: unknown;
  standingPoints?: unknown;
  points?: unknown;
}

const LEGAL_FITS = new Set(FIT.flat());
const LEGAL_STANDING_POINTS = new Set(STANDING_POINTS);

function fail(reason: string): { valid: false; reason: string } {
  return { valid: false, reason };
}

export function validateCountryDraftResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
  edition: string = "",
): { valid: boolean; reason?: string } {
  const score = resultJson.score;
  if (typeof score !== "number" || !Number.isInteger(score)) return fail("score_not_an_integer");
  if (score < 0 || score > MAX_SCORE) return fail("score_out_of_range");
  if (score !== scoreRaw) return fail("score_mismatch");

  const fitTotal = resultJson.fitTotal;
  const standingTotal = resultJson.standingTotal;
  const bonusTotal = resultJson.bonusTotal;
  if (typeof fitTotal !== "number" || typeof standingTotal !== "number" || typeof bonusTotal !== "number") {
    return fail("totals_missing");
  }
  if (fitTotal < 0 || fitTotal > 125) return fail("fit_total_out_of_range");
  if (standingTotal < 0 || standingTotal > MAX_BASE - 125) return fail("standing_total_out_of_range");
  if (bonusTotal < 0 || bonusTotal > MAX_BONUS) return fail("bonus_total_out_of_range");
  if (fitTotal + standingTotal + bonusTotal !== score) return fail("totals_do_not_sum");

  const appointments = resultJson.appointments;
  if (!Array.isArray(appointments) || appointments.length !== ROUNDS) return fail("appointments_missing");
  const picks = appointments as SubmittedPick[];
  const rounds = new Set<number>();
  const seats = new Set<number>();
  for (const p of picks) {
    if (typeof p.round !== "number" || p.round < 0 || p.round >= ROUNDS) return fail("round_out_of_range");
    if (typeof p.seat !== "number" || p.seat < 0 || p.seat >= ROUNDS) return fail("seat_out_of_range");
    rounds.add(p.round);
    seats.add(p.seat);
  }
  if (rounds.size !== ROUNDS) return fail("round_repeated");
  if (seats.size !== ROUNDS) return fail("seat_repeated");

  if (bandOf(score).key !== resultJson.band) return fail("band_mismatch");

  // The arithmetic of the cabinet as submitted: every fit and every standing has to be a
  // value the table can produce, the parts have to add up to the row and the rows to the
  // totals, and the three bonuses have to follow from the five appointments. This holds
  // with no roster at all, so it is the floor a fabricated payload has to clear.
  let claimedFit = 0;
  let claimedStanding = 0;
  const claimedStandings: number[] = [];
  for (const p of picks) {
    if (typeof p.fit !== "number" || !LEGAL_FITS.has(p.fit)) return fail("fit_not_on_the_table");
    if (typeof p.standingPoints !== "number" || !LEGAL_STANDING_POINTS.has(p.standingPoints)) return fail("standing_not_on_the_curve");
    if (typeof p.standing !== "number" || STANDING_POINTS[p.standing] !== p.standingPoints) return fail("standing_does_not_match");
    if (p.points !== p.fit + p.standingPoints) return fail("appointment_does_not_sum");
    claimedFit += p.fit;
    claimedStanding += p.standingPoints;
    claimedStandings.push(p.standing);
  }
  if (claimedFit !== fitTotal) return fail("fit_total_does_not_sum");
  if (claimedStanding !== standingTotal) return fail("standing_total_does_not_sum");
  const claimedPicks = picks.map((p) => ({
    round: p.round as number,
    seat: p.seat as SeatIdx,
    poolIdx: 0 as const,
    fit: p.fit as number,
    standingPoints: p.standingPoints as number,
    points: p.points as number,
  }));
  const claimedBonuses = bonusesOf(claimedPicks, claimedStandings);
  const submittedBonuses = resultJson.bonuses as Record<string, unknown> | undefined;
  if (
    !submittedBonuses ||
    submittedBonuses.fullCabinet !== claimedBonuses.fullCabinet ||
    submittedBonuses.rightHand !== claimedBonuses.rightHand ||
    submittedBonuses.threeNaturals !== claimedBonuses.threeNaturals
  ) {
    return fail("bonus_mismatch");
  }
  if (bonusTotalOf(claimedBonuses) !== bonusTotal) return fail("bonus_total_does_not_sum");

  // Everything above holds whatever the roster is. Only the replay below is skipped when
  // the roster was deployed mid-day: rejecting honest runs for that would be worse than
  // accepting a run whose board is one version behind.
  if (resultJson.poolVersion !== POOL_VERSION) {
    // The roster was deployed mid-day and this run's board cannot be re-derived. The
    // arithmetic above still holds, and no board the generator will accept allows more
    // than MAX_CEILING, so a claim above that is a fabrication whatever roster it came
    // from. Everything at or under it is taken on trust rather than thrown away.
    return score > MAX_CEILING ? fail("above_any_board") : { valid: true };
  }

  const board = createBoard(mulberry32(dateSeed(dateKey + edition)));
  if (board.ceiling !== resultJson.ceiling) return fail("ceiling_mismatch");
  if (resultJson.gap !== board.ceiling - score) return fail("gap_mismatch");

  const expectedCountries = board.rounds.map((r) => r.iso3);
  const claimedCountries = resultJson.roundCountries;
  if (!Array.isArray(claimedCountries) || claimedCountries.join(",") !== expectedCountries.join(",")) {
    return fail("board_mismatch");
  }
  const expectedNames = board.rounds.flatMap((r) => r.pool.map((p) => p.name));
  const claimedNames = resultJson.poolNames;
  if (Array.isArray(claimedNames) && claimedNames.length !== expectedNames.length) return fail("pool_size_mismatch");
  if (!Array.isArray(claimedNames) || claimedNames.join("|") !== expectedNames.join("|")) {
    return fail("pool_mismatch");
  }

  // Every fit and every standing is taken from the regenerated roster, never from the
  // payload: a client that renames a person or inflates their standing changes nothing.
  const ordered = [...picks].sort((a, b) => (a.round as number) - (b.round as number));
  let fit = 0;
  let standing = 0;
  const standings: number[] = [];
  const recomputed = ordered.map((p) => {
    const round = board.rounds[p.round as number];
    const seat = p.seat as SeatIdx;
    const figure = round.pool.find((f) => f.name === p.name);
    if (!figure) return null;
    const f = fitOf(figure.archetype, seat);
    const sp = standingPointsOf(figure.standing);
    fit += f;
    standing += sp;
    standings.push(figure.standing);
    return { round: p.round as number, seat, poolIdx: 0 as const, fit: f, standingPoints: sp, points: f + sp };
  });
  if (recomputed.some((p) => p === null)) return fail("person_not_on_the_board");
  const real = recomputed as NonNullable<(typeof recomputed)[number]>[];
  if (fit !== fitTotal) return fail("fit_total_mismatch");
  if (standing !== standingTotal) return fail("standing_total_mismatch");

  const bonuses = bonusesOf(real, standings);
  if (
    bonuses.fullCabinet !== claimedBonuses.fullCabinet ||
    bonuses.rightHand !== claimedBonuses.rightHand ||
    bonuses.threeNaturals !== claimedBonuses.threeNaturals
  ) {
    return fail("replayed_bonus_mismatch");
  }
  if (fit + standing + bonusTotalOf(bonuses) !== score) return fail("recomputed_score_mismatch");
  return { valid: true };
}
