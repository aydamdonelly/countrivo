/** Country Draft: the shapes the board, the payload and the validator all read. */

export type SeatIdx = 0 | 1 | 2 | 3 | 4;
export type PoolIdx = 0 | 1 | 2;

/** One person on offer. `archetype` indexes ARCHETYPE_LABELS, `standing` runs 1 to 5. */
export interface DraftFigure {
  name: string;
  /** One factual clause, straight from figures.json. */
  note: string;
  archetype: number;
  standing: number;
}

/** One round: a country, and the three people it puts on the table. */
export interface DraftRound {
  iso3: string;
  iso2: string;
  name: string;
  /** `Americas · South America`. */
  region: string;
  pool: readonly DraftFigure[];
}

export interface DraftPick {
  round: number;
  seat: SeatIdx;
  poolIdx: PoolIdx;
  fit: number;
  standingPoints: number;
  points: number;
}

export interface DraftBoard {
  rounds: readonly DraftRound[];
  /** The best score this board allows, and the five appointments that reach it. */
  ceiling: number;
  best: readonly DraftPick[];
}

export interface DraftBonuses {
  fullCabinet: boolean;
  rightHand: boolean;
  threeNaturals: boolean;
}

export interface DraftScore {
  fitTotal: number;
  standingTotal: number;
  bonusTotal: number;
  bonuses: DraftBonuses;
  score: number;
}

/** The state the module reduces. `held` is the hand and is never persisted. */
export interface DraftState {
  board: DraftBoard;
  /** 0 to 4 while playing, 5 once every seat is filled. */
  round: number;
  held: PoolIdx | null;
  /** Indexed by seat, so the cabinet renders in seat order with no lookup. */
  seats: readonly (DraftPick | null)[];
  undoUsed: boolean;
  phase: "playing" | "reveal" | "done";
  /** Appointments applied so far: a resumed board arrives settled and animates nothing. */
  moves: number;
  /** The seat the last appointment landed in, for the one counting numeral. */
  lastSeat: SeatIdx | null;
}
