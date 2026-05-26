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
  playerCard: SupremacyCard;
  aiCard: SupremacyCard; // always defined; reveal is signalled by phase
  chosenStat: string | null;
  winner: "player" | "ai" | "draw" | null;
}

export interface SupremacyState {
  phase: "picking" | "reveal" | "results";
  playerHand: SupremacyCard[];
  aiHand: SupremacyCard[];
  categories: Category[];
  currentRound: number;
  rounds: SupremacyRound[];
  playerScore: number;
  aiScore: number;
  isPlayerTurn: boolean; // true = player picks the stat this round
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

export function createSupremacy(rng: () => number): SupremacyState {
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

  /* Build cards — player always gets first half (deterministic). */
  const allCards = picked.map((c) => buildCard(c, gameCats));
  const playerHand = allCards.slice(0, 5);
  const aiHand = allCards.slice(5, 10);

  /* Player picks first round. */
  const rounds: SupremacyRound[] = [
    {
      playerCard: playerHand[0],
      aiCard: aiHand[0],
      chosenStat: null,
      winner: null,
    },
  ];

  return {
    phase: "picking",
    playerHand,
    aiHand,
    categories: gameCats,
    currentRound: 0,
    rounds,
    playerScore: 0,
    aiScore: 0,
    isPlayerTurn: true,
  };
}

/* ── Pick stat (player or AI) ─────────────────────────────────────── */

export function pickStat(
  state: SupremacyState,
  categorySlug: string,
): SupremacyState {
  if (state.phase !== "picking") return state;

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

export function reveal(state: SupremacyState): SupremacyState {
  if (state.phase !== "reveal") return state;

  const round = state.rounds[state.currentRound];
  const chosenStat = round.chosenStat;
  if (!chosenStat) return state;

  const playerVal = round.playerCard.stats[chosenStat];
  const aiVal = round.aiCard.stats[chosenStat];

  let winner: "player" | "ai" | "draw";
  if (playerVal === null && aiVal === null) {
    winner = "draw";
  } else if (playerVal === null) {
    winner = "ai";
  } else if (aiVal === null) {
    winner = "player";
  } else if (playerVal > aiVal) {
    winner = "player";
  } else if (aiVal > playerVal) {
    winner = "ai";
  } else {
    winner = "draw";
  }

  const newPlayerScore = state.playerScore + (winner === "player" ? 1 : 0);
  const newAiScore = state.aiScore + (winner === "ai" ? 1 : 0);

  return {
    ...state,
    rounds: [
      ...state.rounds.slice(0, state.currentRound),
      { ...round, winner },
      ...state.rounds.slice(state.currentRound + 1),
    ],
    playerScore: newPlayerScore,
    aiScore: newAiScore,
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
  const nextIsPlayerTurn = !state.isPlayerTurn;

  const nextRoundData: SupremacyRound = {
    playerCard: state.playerHand[nextRound],
    aiCard: state.aiHand[nextRound],
    chosenStat: null,
    winner: null,
  };

  return {
    ...state,
    currentRound: nextRound,
    isPlayerTurn: nextIsPlayerTurn,
    rounds: [...state.rounds, nextRoundData],
    phase: "picking",
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
