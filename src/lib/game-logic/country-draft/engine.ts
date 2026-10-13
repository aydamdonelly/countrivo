import { mulberry32 } from "@/lib/seeded-random";
import { createBoard, type DraftBoardOptions } from "./generator";
import { makePick, scoreOf } from "./scoring";
import { ROUNDS } from "./tables";
import type { DraftBoard, DraftPick, DraftScore, DraftState, PoolIdx, SeatIdx } from "./types";

export function createGame(seed: number, options?: DraftBoardOptions): DraftState {
  return { board: createBoard(mulberry32(seed), options), round: 0, country: null, held: null, selectedCountry: null, selectedSeat: null, seats: [null, null, null, null, null], phase: "country", moves: 0, lastSeat: null };
}

export function filledSeats(s: DraftState): number { return s.seats.filter((x) => x !== null).length; }
export function appointmentsOf(s: DraftState): DraftPick[] { return s.seats.filter((x): x is DraftPick => x !== null).sort((a, b) => a.round - b.round); }
export function countryAt(board: DraftBoard, pick: DraftPick) { return board.rounds[pick.round].countries[pick.countryIdx]; }
export function figureAt(board: DraftBoard, pick: DraftPick) { return countryAt(board, pick).pool[pick.poolIdx]; }
export function scoreState(s: DraftState): DraftScore { return scoreOf(appointmentsOf(s)); }

export function chooseCountry(s: DraftState, c: PoolIdx): DraftState {
  return s.phase === "country" && s.board.rounds[s.round]?.countries[c] ? { ...s, selectedCountry: c } : s;
}

export function openCountry(s: DraftState, c: PoolIdx): DraftState {
  return s.phase === "country" && s.board.rounds[s.round]?.countries[c] ? { ...s, country: c, selectedCountry: null, phase: "people", moves: s.moves + 1 } : s;
}

export function hold(s: DraftState, i: PoolIdx): DraftState {
  if (s.phase !== "people" || s.country === null || !s.board.rounds[s.round].countries[s.country].pool[i]) return s;
  const open = s.seats.map((pick, seat) => pick === null ? seat : null).filter((seat): seat is SeatIdx => seat === 0 || seat === 1 || seat === 2 || seat === 3 || seat === 4);
  return { ...s, held: i, selectedSeat: open.length === 1 ? open[0] : null };
}

export function chooseSeat(s: DraftState, seat: SeatIdx): DraftState {
  return s.phase === "people" && s.held !== null && s.seats[seat] === null ? { ...s, selectedSeat: seat } : s;
}

export function drop(s: DraftState): DraftState { return s.held === null ? s : { ...s, held: null, selectedSeat: null }; }

export function appoint(s: DraftState, i: PoolIdx, seat: SeatIdx): DraftState {
  if (s.phase !== "people" || s.country === null || s.seats[seat] !== null) return s;
  const country = s.board.rounds[s.round].countries[s.country];
  const figure = country.pool[i];
  if (!figure) return s;
  const pick = makePick(s.round, s.country, seat, i, figure, country.region);
  return { ...s, seats: s.seats.map((x, k) => k === seat ? pick : x), held: null, selectedSeat: null, phase: "seated", moves: s.moves + 1, lastSeat: seat };
}

/** A reveal stays until the player chooses to continue. There is no undo after reveal. */
export function nextRound(s: DraftState): DraftState {
  if (s.phase !== "seated") return s;
  if (s.round === ROUNDS - 1) return { ...s, phase: "done" };
  return { ...s, round: s.round + 1, country: null, held: null, selectedCountry: null, selectedSeat: null, phase: "country" };
}

export function seen(s: DraftState): DraftState { return s.phase === "seated" && s.round === ROUNDS - 1 ? nextRound(s) : s; }
export function isComplete(s: DraftState): boolean { return s.phase === "done"; }
