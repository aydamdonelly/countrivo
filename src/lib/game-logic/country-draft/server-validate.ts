import { dateSeed } from "@/lib/daily-seed";
import { appoint, appointmentsOf, countryAt, createGame, figureAt, nextRound, openCountry, scoreState } from "./engine";
import { POOL_VERSION } from "./roster";
import { MAX_SCORE, ROUNDS, bandOf } from "./tables";
import { poolIndex, seatIndex } from "./types";

function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function fail(reason: string): { valid: false; reason: string } { return { valid: false, reason }; }

/** Recreate every country choice and appointment; none of the submitted arithmetic is trusted. */
export function validateCountryDraftResult(dateKey: string, scoreRaw: number, resultJson: Record<string, unknown>, edition = "", serverSeed?: number): { valid: boolean; reason?: string } {
  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > MAX_SCORE) return fail("score_out_of_range");
  if (resultJson.poolVersion !== POOL_VERSION) return fail("outdated_board");
  if (!Array.isArray(resultJson.appointments) || resultJson.appointments.length !== ROUNDS) return fail("appointments_missing");
  let state = createGame(serverSeed ?? dateSeed(dateKey + edition));
  const ordered = resultJson.appointments.filter(record).sort((a, b) => Number(a.round) - Number(b.round));
  if (ordered.length !== ROUNDS) return fail("invalid_appointment");
  for (let round = 0; round < ROUNDS; round += 1) {
    const row = ordered[round];
    if (row.round !== round || typeof row.countryIdx !== "number" || typeof row.poolIdx !== "number" || typeof row.seat !== "number") return fail("invalid_appointment");
    const countryIdx = poolIndex(row.countryIdx);
    const poolIdx = poolIndex(row.poolIdx);
    const seat = seatIndex(row.seat);
    if (countryIdx === null || poolIdx === null || seat === null) return fail("invalid_appointment");
    state = openCountry(state, countryIdx);
    const seated = appoint(state, poolIdx, seat);
    if (seated === state) return fail("seat_repeated");
    state = seated;
    const pick = state.seats[seat];
    if (!pick) return fail("appointment_missing");
    const country = countryAt(state.board, pick);
    const figure = figureAt(state.board, pick);
    if (row.name !== figure.name || row.iso3 !== country.iso3 || row.fit !== pick.fit || row.points !== pick.points || row.standingPoints !== pick.standingPoints || row.standing !== figure.standing) return fail("appointment_mismatch");
    state = nextRound(state);
  }
  const scored = scoreState(state);
  if (scored.score !== scoreRaw || resultJson.score !== scored.score) return fail("score_mismatch");
  if (resultJson.fitTotal !== scored.fitTotal || resultJson.standingTotal !== scored.standingTotal || resultJson.bonusTotal !== scored.bonusTotal) return fail("totals_mismatch");
  if (resultJson.band !== bandOf(scored.score).key) return fail("band_mismatch");
  const submittedBonuses = resultJson.bonuses;
  if (!record(submittedBonuses) || Object.entries(scored.bonuses).some(([key, value]) => submittedBonuses[key] !== value)) return fail("bonus_mismatch");
  if (!Array.isArray(resultJson.roundCountries) || resultJson.roundCountries.join(",") !== appointmentsOf(state).map((p) => countryAt(state.board, p).iso3).join(",")) return fail("board_mismatch");
  return { valid: true };
}
