import { mulberry32 } from "@/lib/seeded-random";
import { advanceRound, aiPickStat, createSupremacy, pickStat, reveal, type SupremacyState } from "@/lib/game-logic/supremacy/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type SupremacyAction = { t: "pick"; slug: string } | { t: "aipick" } | { t: "reveal" } | { t: "advance" };

export const SUPREMACY_ROUNDS = 5;

/** The AI thinks for this long before it picks (blueprint 8.8). */
const AI_MS = 800;
/** The cards turn over this long after a pick. */
const REVEAL_MS = 200;
/** The round holds this long once both cards are up. */
const HOLD_MS = 2000;

export const gameModule: GameModule<SupremacyState, SupremacyAction> = {
  slug: "supremacy",
  create(seed) {
    return createSupremacy(mulberry32(seed));
  },
  reduce(s, a) {
    const round = s.rounds[s.currentRound];
    switch (a.t) {
      case "pick":
        return s.phase === "picking" && s.isPlayerTurn && s.categories.some((c) => c.slug === a.slug) ? pickStat(s, a.slug) : s;
      case "aipick":
        return s.phase === "picking" && !s.isPlayerTurn ? pickStat(s, aiPickStat(round.aiCard, s.categories)) : s;
      case "reveal":
        return s.phase === "reveal" && round.winner === null ? reveal(s) : s;
      case "advance":
        return s.phase === "reveal" && round.winner !== null ? advanceRound(s) : s;
      default:
        return s;
    }
  },
  codec,
  persist: () => false,
  /** The AI turn, the card flip and the hold between rounds (blueprint 8.8). */
  after(s) {
    if (s.phase === "results") return null;
    const round = s.rounds[s.currentRound];
    if (s.phase === "picking") return s.isPlayerTurn ? null : { ms: AI_MS, then: { t: "aipick" } };
    if (round.winner === null) return { ms: REVEAL_MS, then: { t: "reveal" } };
    return { ms: HOLD_MS, then: { t: "advance" } };
  },
  done: (s) => s.phase === "results",
  progress(s) {
    return {
      done: s.rounds.filter((r) => r.winner !== null).length,
      total: SUPREMACY_ROUNDS,
      label: "round",
      value: `${Math.min(s.currentRound + 1, SUPREMACY_ROUNDS)} of ${SUPREMACY_ROUNDS}`,
      extra: `you ${s.playerScore} · ai ${s.aiScore}`,
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "reveal" || next === prev) return null;
    const winner = next.rounds[next.currentRound].winner;
    if (winner === "player") return { tone: "good", text: "You win this round." };
    if (winner === "ai") return { tone: "bad", text: "AI wins this round." };
    return { tone: "neutral", text: "Draw." };
  },
  payload(s, ctx) {
    return {
      gameSlug: "supremacy",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.playerScore,
      scoreMax: SUPREMACY_ROUNDS,
      scoreSortValue: s.playerScore,
      scoreDisplay: `${s.playerScore} - ${s.aiScore}`,
      resultJson: { score: s.playerScore, total: SUPREMACY_ROUNDS, correct: s.playerScore },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.playerScore} - ${s.aiScore}`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase !== "picking" || !s.isPlayerTurn) return {};
    const map: Record<string, () => void> = {};
    s.categories.forEach((c, i) => {
      map[String(i + 1)] = () => dispatch({ t: "pick", slug: c.slug });
    });
    return map;
  },
  keyHint: "1 to 5 pick a stat",
  keepBoardOnResult: false,
  submits: false,
};
