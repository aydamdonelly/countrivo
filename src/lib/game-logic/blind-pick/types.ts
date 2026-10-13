import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

/**
 * One Blind Pick board (concept 5.7): six countries in arrival order and six stat slots in
 * display order. Every rank is a rank among sovereign states only, so "#12 of 193" means
 * twelfth of the 193 sovereign states that have the number.
 */
export interface BlindPickConfig {
  /** The six countries, in the order they arrive. */
  countries: Country[];
  /** The six stat slots, in display order (slot index = position on the board). */
  categories: Category[];
  /** costMatrix[countryIdx][slotIdx] = the country's rank among sovereign states on that stat. */
  costMatrix: number[][];
  /** of[slotIdx] = how many sovereign states are ranked on that stat. */
  of: number[];
  /** The lowest possible sum of ranks over the six placements. */
  optimalScore: number;
  /** One perfect placement: optimalAssignment[countryIdx] = slotIdx. */
  optimalAssignment: number[];
  /** The sum a player reaches by putting every country on its best free stat as it arrives. */
  greedyScore: number;
  mode: "daily" | "practice";
  dateKey: string;
}

/** A run in progress. `placements[countryIdx] = slotIdx`; its length is how many countries are placed. */
export interface BlindPickGame {
  config: BlindPickConfig;
  placements: number[];
}

/** The four tier words a placed slot shows under its rank. */
export type BlindPickTier = "Top 10" | "Top 50" | "Middle" | "Bottom half";

/** One cycle of moves that turns the player's board into the perfect one. */
export interface BlindPickSwap {
  /** The countries in the cycle, each with the slot it should have taken. */
  moves: { countryIdx: number; toSlot: number }[];
  /** Ranks saved by making these moves (always positive). */
  saved: number;
}

export interface BlindPickResult {
  /** The player's sum of ranks. */
  playerScore: number;
  optimalScore: number;
  /** Golf: playerScore minus optimalScore, 0 is "Perfect". */
  over: number;
  /** The player's slot per country (arrival order). */
  placements: number[];
  /** The player's rank per country. */
  ranks: number[];
  /** The perfect board closest to the player's: slot per country. */
  perfect: number[];
  /** The rank each country holds on its perfect slot. */
  perfectRanks: number[];
  /** The cycles of moves that would have fixed the board; empty when perfect. */
  swaps: BlindPickSwap[];
}
