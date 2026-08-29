/*
 * The Country Draft state machine. Pure: every transition is a function of the state and
 * the action, so the host replays a resume log through it and lands on the same board the
 * player left. Illegal actions return the state unchanged, per the module contract.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { createBoard } from "./generator";
import { makePick, scoreOf } from "./scoring";
import { ROUNDS } from "./tables";
import type { DraftBoard, DraftPick, DraftScore, DraftState, PoolIdx, SeatIdx } from "./types";

export function createGame(seed: number): DraftState {
  return {
    board: createBoard(mulberry32(seed)),
    round: 0,
    held: null,
    seats: [null, null, null, null, null],
    undoUsed: false,
    phase: "playing",
    moves: 0,
    lastSeat: null,
  };
}

export function filledSeats(s: DraftState): number {
  return s.seats.filter((x) => x !== null).length;
}

/** The appointments in round order: what the payload and the result rows read. */
export function appointmentsOf(s: DraftState): DraftPick[] {
  return s.seats.filter((x): x is DraftPick => x !== null).sort((a, b) => a.round - b.round);
}

export function figureAt(board: DraftBoard, pick: DraftPick) {
  return board.rounds[pick.round].pool[pick.poolIdx];
}

export function scoreState(s: DraftState): DraftScore {
  const picks = appointmentsOf(s);
  return scoreOf(picks, picks.map((p) => figureAt(s.board, p).standing));
}

export function canUndo(s: DraftState): boolean {
  return !s.undoUsed && s.phase !== "done" && filledSeats(s) > 0;
}

export function hold(s: DraftState, i: PoolIdx): DraftState {
  if (s.phase !== "playing" || s.round >= ROUNDS) return s;
  if (i < 0 || i >= s.board.rounds[s.round].pool.length) return s;
  return { ...s, held: s.held === i ? null : i };
}

export function drop(s: DraftState): DraftState {
  return s.held === null ? s : { ...s, held: null };
}

/** Seat one of the round's three. Fills the fifth seat and the reveal window opens. */
export function appoint(s: DraftState, i: PoolIdx, seat: SeatIdx): DraftState {
  if (s.phase !== "playing" || s.round >= ROUNDS) return s;
  if (seat < 0 || seat >= s.seats.length || s.seats[seat] !== null) return s;
  const round = s.board.rounds[s.round];
  if (i < 0 || i >= round.pool.length) return s;
  const pick = makePick(s.round, seat, i, round.pool[i]);
  const seats = s.seats.map((x, k) => (k === seat ? pick : x));
  const round1 = s.round + 1;
  return {
    ...s,
    seats,
    round: round1,
    held: null,
    phase: round1 >= ROUNDS ? "reveal" : "playing",
    moves: s.moves + 1,
    lastSeat: seat,
  };
}

/** One take-back per run, allowed while playing and during the reveal window. */
export function undo(s: DraftState): DraftState {
  if (!canUndo(s)) return s;
  const last = appointmentsOf(s).pop();
  if (!last) return s;
  return {
    ...s,
    seats: s.seats.map((x, k) => (k === last.seat ? null : x)),
    round: last.round,
    held: null,
    undoUsed: true,
    phase: "playing",
    moves: s.moves + 1,
    lastSeat: null,
  };
}

export function seen(s: DraftState): DraftState {
  return s.phase === "reveal" ? { ...s, phase: "done" } : s;
}

export function isComplete(s: DraftState): boolean {
  return filledSeats(s) === ROUNDS;
}
