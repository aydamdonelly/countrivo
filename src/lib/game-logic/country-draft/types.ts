export type SeatIdx = 0 | 1 | 2 | 3 | 4;
export type PoolIdx = 0 | 1 | 2;
export type DraftPhase = "country" | "people" | "seated" | "done";

export interface DraftFigure {
  name: string;
  slug: string;
  portrait: boolean;
  note: string;
  identity: string;
  archetype: number;
  standing: number;
  born: number | null;
  died: number | null;
  activeFrom: number | null;
  activeUntil: number | null;
  era: "early" | "recent" | "middle";
  source: string;
  biography: string;
  fits?: readonly number[];
  fitEvidence?: readonly { line: string; source: string }[];
  fame?: number;
}

export interface DraftCountry {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  pool: readonly DraftFigure[];
}

export interface DraftRound {
  countries: readonly DraftCountry[];
}

export interface DraftPick {
  round: number;
  countryIdx: PoolIdx;
  seat: SeatIdx;
  poolIdx: PoolIdx;
  region: string;
  era: DraftFigure["era"];
  fit: number;
  standingPoints: number;
  points: number;
}

export interface DraftBoard {
  rounds: readonly DraftRound[];
  ceiling: number;
  best: readonly DraftPick[];
}

export interface DraftBonuses {
  fullCabinet: boolean;
  threeRegions: boolean;
  acrossAges: boolean;
}

export interface DraftScore {
  fitTotal: number;
  standingTotal: number;
  bonusTotal: number;
  bonuses: DraftBonuses;
  score: number;
}

/** Full solution-bearing state stays on the server. The browser receives DraftView. */
export interface DraftState {
  board: DraftBoard;
  round: number;
  country: PoolIdx | null;
  held: PoolIdx | null;
  selectedCountry: PoolIdx | null;
  selectedSeat: SeatIdx | null;
  seats: readonly (DraftPick | null)[];
  phase: DraftPhase;
  moves: number;
  lastSeat: SeatIdx | null;
}

export function poolIndex(value: number): PoolIdx | null {
  return value === 0 || value === 1 || value === 2 ? value : null;
}

export function seatIndex(value: number): SeatIdx | null {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 ? value : null;
}
