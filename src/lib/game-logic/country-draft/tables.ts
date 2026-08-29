/*
 * Country Draft: the published model. Every number the game scores with lives here and
 * nowhere else; src/content/draft.ts prints these same values on the landing page, so a
 * player who reads that table is reading the engine.
 *
 * Five seats, eight archetypes, one fit value per pair. Nothing in the score is rolled:
 * two identical cabinets always score the same number.
 */

/** Rounds in a board, and seats in a cabinet. One appointment per round. */
export const ROUNDS = 5;
export const SEAT_COUNT = 5;
/** People offered per round; they always carry three different archetypes. */
export const POOL_SIZE = 3;

/** Five appointments at a natural fit and standing 5. */
export const MAX_BASE = 175;
export const MAX_BONUS = 20;
export const MAX_SCORE = 195;

/**
 * The board is regenerated until the best line it allows falls inside this window and
 * until a player who always takes the biggest number in front of them lands at least
 * MIN_GREEDY_GAP short of it. The first keeps par steady from one day to the next; the
 * second is the game: a board that rewards greed has no decision in it.
 */
export const MIN_CEILING = 166;
export const MAX_CEILING = 186;
export const MIN_GREEDY_GAP = 12;
export const GEN_ATTEMPTS = 40;

/** The board stays live after the fifth appointment so the last one can still be taken back. */
export const RESULT_REVEAL_MS = 60_000;

export const SEAT_NAMES = ["The Chair", "The Field", "The Purse", "The Voice", "The Desk"] as const;
/** Rendered under the seat name, on the board and in the seats table. */
export const SEAT_WANTS = ["runs the room", "takes ground", "pays for it", "sells it", "makes it hold"] as const;

/**
 * The eight archetypes, in fit-table order. scripts/build-draft-pool.mjs folds the twelve
 * authored categories of figures.json into these, and the index into this list is what
 * draft-pool.json stores.
 */
export const ARCHETYPE_LABELS = [
  "Sovereign",
  "Commander",
  "Financier",
  "Performer",
  "Builder",
  "Firebrand",
  "Contender",
  "Outlaw",
] as const;

export const ARCHETYPE_MEANS = [
  "held power over a state",
  "led armies in the field",
  "moved money at scale",
  "worked a crowd",
  "made a thing that lasts",
  "changed minds on the page",
  "won in the open",
  "took what was not theirs",
] as const;

/**
 * FIT[archetype][seat]. Five seats, five naturals: the Chair wants a Sovereign, the Field
 * a Commander, the Purse a Financier, the Voice a Performer, the Desk a Builder. The last
 * three archetypes have no natural anywhere, which is what makes them the interesting
 * pick: never perfect, never dead. The five zeros each read as obvious once seen. A
 * Financier cannot take a hill, a Performer cannot draft a statute, a Builder cannot work
 * a crowd, a Firebrand cannot mind the money, an Outlaw cannot make a thing hold.
 */
export const FIT: readonly (readonly number[])[] = [
  [25, 12, 12, 6, 6],
  [12, 25, 6, 6, 12],
  [12, 0, 25, 6, 12],
  [6, 6, 6, 25, 0],
  [6, 12, 12, 0, 25],
  [18, 6, 0, 18, 6],
  [6, 18, 6, 12, 18],
  [6, 18, 18, 6, 0],
];

/** The five fit values in the player's language. */
export const FIT_WORDS: readonly { points: number; word: string }[] = [
  { points: 25, word: "natural" },
  { points: 18, word: "strong" },
  { points: 12, word: "plausible" },
  { points: 6, word: "thin" },
  { points: 0, word: "wrong" },
];

/** Standing 1 to 5 in points; index 0 is unreachable and pays nothing. */
export const STANDING_POINTS: readonly number[] = [0, 0, 2, 5, 7, 10];

/** The three bonuses. None of them depends on the board; all three are decisions. */
export const BONUS_POINTS = { fullCabinet: 8, rightHand: 7, threeNaturals: 5 } as const;

export const BONUSES: readonly { key: keyof typeof BONUS_POINTS; name: string; needs: string; points: number }[] = [
  { key: "fullCabinet", name: "Full cabinet", needs: "every seat took a fit of 12 or better", points: BONUS_POINTS.fullCabinet },
  { key: "rightHand", name: "Right hand", needs: "your highest standing sits at a natural fit", points: BONUS_POINTS.rightHand },
  { key: "threeNaturals", name: "Three naturals", needs: "three seats or more took a natural fit", points: BONUS_POINTS.threeNaturals },
];

export type BandKey = "footnote" | "region" | "continent" | "most" | "whole";

/** The bands, highest first. The word is the grade; there is never a star or a colour. */
export const BANDS: readonly { from: number; key: BandKey; word: string }[] = [
  { from: 160, key: "whole", word: "The whole thing." },
  { from: 120, key: "most", word: "Most of the map." },
  { from: 80, key: "continent", word: "A continent." },
  { from: 40, key: "region", word: "A region." },
  { from: 0, key: "footnote", word: "A footnote." },
];

export function fitWord(fit: number): string {
  return FIT_WORDS.find((f) => f.points === fit)?.word ?? "thin";
}

export function bandOf(score: number): { key: BandKey; word: string } {
  const b = BANDS.find((x) => score >= x.from) ?? BANDS[BANDS.length - 1];
  return { key: b.key, word: b.word };
}

/**
 * How a fit reads on the board and on the result: ink for the two that earned the seat,
 * mute for the two that will do, ember text for the one that did not. Ember is never a
 * fill behind text.
 */
export function fitQuality(fit: number): "good" | "fair" | "bad" {
  if (fit >= 18) return "good";
  if (fit > 0) return "fair";
  return "bad";
}
