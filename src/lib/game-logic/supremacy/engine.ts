import { countries, categories } from "@/lib/data/loader";
import statsData from "@/data/stats.json";
import { seededPick } from "@/lib/seeded-random";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

const stats: Record<string, Record<string, number | null>> = statsData;

/* Categories with wide variance — good for a Top Trumps style game */
const GOOD_CATS = [
  "population",
  "area-km2",
  "gdp-per-capita",
  "life-expectancy",
  "tourism-arrivals",
];

const TOTAL_ROUNDS = 5;

/* ── Types ─────────────────────────────────────────────────────────── */

export interface SupremacyCard {
  country: Country;
  stats: Record<string, number | null>;
}

export interface SupremacyRound {
  myCard: SupremacyCard;
  opponentCard: SupremacyCard | null; // null until revealed
  chosenStat: string | null;
  winner: "me" | "opponent" | "draw" | null;
}

export interface SupremacyState {
  phase: "waiting" | "picking" | "reveal" | "results";
  hand: SupremacyCard[];
  opponentHand: SupremacyCard[]; // used in practice; empty in versus
  opponentHandSize: number;
  categories: Category[];
  currentRound: number;
  rounds: SupremacyRound[];
  myScore: number;
  opponentScore: number;
  isMyTurn: boolean; // true = I pick the stat this round
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function buildCard(country: Country, cats: Category[]): SupremacyCard {
  const cardStats: Record<string, number | null> = {};
  for (const cat of cats) {
    cardStats[cat.slug] = stats[country.iso3]?.[cat.slug] ?? null;
  }
  return { country, stats: cardStats };
}

/* ── Create game ───────────────────────────────────────────────────── */

export function createSupremacy(
  rng: () => number,
  isPlayer1: boolean,
): SupremacyState {
  /* Pick 5 categories from good list */
  const usableCats = categories.filter((c) => GOOD_CATS.includes(c.slug));
  const gameCats = seededPick(usableCats, 5, rng);

  /* Pick 10 countries that have data for at least 3 of the chosen categories */
  const eligible = countries.filter((c) => {
    let hasData = 0;
    for (const cat of gameCats) {
      if (
        stats[c.iso3]?.[cat.slug] !== undefined &&
        stats[c.iso3]?.[cat.slug] !== null
      ) {
        hasData++;
      }
    }
    return hasData >= 3;
  });

  const picked = seededPick(eligible, 10, rng);

  /* Build cards */
  const allCards = picked.map((c) => buildCard(c, gameCats));
  const firstHalf = allCards.slice(0, 5);
  const secondHalf = allCards.slice(5, 10);

  const myHand = isPlayer1 ? firstHalf : secondHalf;
  const oppHand = isPlayer1 ? secondHalf : firstHalf;

  /* Seed the first round */
  const isMyTurn = isPlayer1;

  const rounds: SupremacyRound[] = [
    {
      myCard: myHand[0],
      opponentCard: null,
      chosenStat: null,
      winner: null,
    },
  ];

  return {
    phase: isMyTurn ? "picking" : "waiting",
    hand: myHand,
    opponentHand: oppHand,
    opponentHandSize: 5,
    categories: gameCats,
    currentRound: 0,
    rounds,
    myScore: 0,
    opponentScore: 0,
    isMyTurn,
  };
}

/* ── Pick stat (either side) ──────────────────────────────────────── */

export function pickStat(
  state: SupremacyState,
  categorySlug: string,
): SupremacyState {
  if (state.phase !== "picking" && state.phase !== "waiting") return state;

  const round = state.rounds[state.currentRound];

  return {
    ...state,
    phase: "reveal",
    rounds: [
      ...state.rounds.slice(0, state.currentRound),
      { ...round, chosenStat: categorySlug },
      ...state.rounds.slice(state.currentRound + 1),
    ],
  };
}

/* ── Reveal cards and determine winner ────────────────────────────── */

export function revealCards(
  state: SupremacyState,
  opponentCard: SupremacyCard,
  chosenStat: string,
): SupremacyState {
  const round = state.rounds[state.currentRound];
  const myVal = round.myCard.stats[chosenStat];
  const oppVal = opponentCard.stats[chosenStat];

  let winner: "me" | "opponent" | "draw";
  if (myVal === null && oppVal === null) {
    winner = "draw";
  } else if (myVal === null) {
    winner = "opponent";
  } else if (oppVal === null) {
    winner = "me";
  } else if (myVal > oppVal) {
    winner = "me";
  } else if (oppVal > myVal) {
    winner = "opponent";
  } else {
    winner = "draw";
  }

  const newMyScore = state.myScore + (winner === "me" ? 1 : 0);
  const newOppScore = state.opponentScore + (winner === "opponent" ? 1 : 0);

  return {
    ...state,
    phase: "reveal",
    rounds: [
      ...state.rounds.slice(0, state.currentRound),
      {
        ...round,
        opponentCard,
        chosenStat,
        winner,
      },
      ...state.rounds.slice(state.currentRound + 1),
    ],
    myScore: newMyScore,
    opponentScore: newOppScore,
  };
}

/* ── Advance to next round or results ─────────────────────────────── */

export function advanceRound(state: SupremacyState): SupremacyState {
  if (state.phase !== "reveal") return state;

  const nextRound = state.currentRound + 1;

  if (nextRound >= TOTAL_ROUNDS) {
    return { ...state, phase: "results" };
  }

  /* Alternate turns */
  const nextIsMyTurn = !state.isMyTurn;

  const nextRoundData: SupremacyRound = {
    myCard: state.hand[nextRound],
    opponentCard: null,
    chosenStat: null,
    winner: null,
  };

  return {
    ...state,
    currentRound: nextRound,
    isMyTurn: nextIsMyTurn,
    opponentHandSize: state.opponentHandSize - 1,
    rounds: [...state.rounds, nextRoundData],
    phase: nextIsMyTurn ? "picking" : "waiting",
  };
}

/* ── AI helpers (practice mode) ───────────────────────────────────── */

/**
 * Simple AI: pick the stat where its top card's value is highest
 * relative to the other stats (by percentile rank among its own values).
 */
export function aiPickStat(
  aiCard: SupremacyCard,
  gameCats: Category[],
): string {
  let bestSlug = gameCats[0].slug;
  let bestVal = -Infinity;

  for (const cat of gameCats) {
    const val = aiCard.stats[cat.slug];
    if (val !== null && val !== undefined && val > bestVal) {
      bestVal = val;
      bestSlug = cat.slug;
    }
  }

  return bestSlug;
}
