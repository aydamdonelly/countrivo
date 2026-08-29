/**
 * The published scoring model of Country Draft, as the landing page prints it: the five
 * seats, the eight archetypes, the fit table, the standing curve and the three bonuses.
 *
 * Every number here is imported from the engine (src/lib/game-logic/country-draft/tables),
 * never typed twice, so the table a player reads on the landing page is literally the
 * table the game scores with. Only the prose lives in this file.
 */
import {
  ARCHETYPE_LABELS,
  ARCHETYPE_MEANS,
  BANDS as ENGINE_BANDS,
  BONUSES as ENGINE_BONUSES,
  FIT,
  FIT_WORDS as ENGINE_FIT_WORDS,
  MAX_BASE as ENGINE_MAX_BASE,
  MAX_BONUS as ENGINE_MAX_BONUS,
  MAX_CEILING as ENGINE_MAX_CEILING,
  MAX_SCORE as ENGINE_MAX_SCORE,
  MIN_CEILING as ENGINE_MIN_CEILING,
  MIN_GREEDY_GAP as ENGINE_MIN_GREEDY_GAP,
  ROUNDS as ENGINE_ROUNDS,
  SEAT_NAMES,
  SEAT_WANTS,
  STANDING_POINTS as ENGINE_STANDING_POINTS,
} from "@/lib/game-logic/country-draft/tables";

/** The five seats, in board order. `natural` is the archetype that scores 25 there. */
export interface Seat {
  /** `The Chair`. */
  name: string;
  /** Rendered under the name on the board and in the seats table. */
  wants: string;
  natural: string;
}

export const SEATS: readonly Seat[] = SEAT_NAMES.map((name, i) => ({
  name,
  wants: SEAT_WANTS[i],
  // Every seat has exactly one archetype that scores 25 in it, and only in it.
  natural: ARCHETYPE_LABELS[FIT.findIndex((row) => row[i] === 25)],
}));

/** The five seat names as the landing card's chips. */
export const SEAT_CHIPS: readonly string[] = SEATS.map((s) => s.name);

/** Column heads for the fit table, short enough for a 50 px column on a phone. */
export const SEAT_SHORT: readonly string[] = SEAT_NAMES.map((n) => n.replace("The ", ""));

export interface Archetype {
  label: string;
  means: string;
  /** Points in seat order: Chair, Field, Purse, Voice, Desk. */
  fit: readonly number[];
}

/** The eight archetypes and the whole fit table. */
export const ARCHETYPES: readonly Archetype[] = ARCHETYPE_LABELS.map((label, i) => ({
  label,
  means: ARCHETYPE_MEANS[i],
  fit: FIT[i],
}));

/** The five fit values in the player's language. */
export const FIT_WORDS = ENGINE_FIT_WORDS;

/** standing 1 to 5, in points. */
export const STANDING_POINTS: readonly number[] = ENGINE_STANDING_POINTS.slice(1);

/** The three bonuses. */
export const BONUSES: readonly { name: string; needs: string; points: number }[] = ENGINE_BONUSES.map((b) => ({
  name: b.name,
  needs: b.needs,
  points: b.points,
}));

/** The score bands, the one word a result is graded with. */
export const BANDS: readonly { from: number; word: string }[] = ENGINE_BANDS.map((b) => ({ from: b.from, word: b.word }));

export const MAX_SCORE = ENGINE_MAX_SCORE;
/** Five appointments at 25 fit plus 10 standing. */
export const MAX_BASE = ENGINE_MAX_BASE;
export const MAX_BONUS = ENGINE_MAX_BONUS;
/** Boards are regenerated until the best possible line lands inside this window. */
export const MIN_CEILING = ENGINE_MIN_CEILING;
export const MAX_CEILING = ENGINE_MAX_CEILING;
/** And until greed lands at least this far short of that line. */
export const MIN_GREEDY_GAP = ENGINE_MIN_GREEDY_GAP;
export const ROUNDS = ENGINE_ROUNDS;

/**
 * The twelve fields a person can come from, as src/data/figures.json files them. Each one
 * belongs to exactly one archetype, and the archetype is what the board prints and what
 * the fit table scores.
 */
export const DRAFT_FIELDS: readonly string[] = [
  "leaders",
  "commanders",
  "rulers by force",
  "founders and financiers",
  "scientists and explorers",
  "writers and poets",
  "musicians",
  "screen and stage",
  "comedians",
  "athletes",
  "broadcasters",
  "outlaws",
];
