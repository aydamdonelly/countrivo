import { mulberry32 } from "@/lib/seeded-random";
import { bank, createRiskZone, guess, nextChain, push, riskMultiplier, RISK_CHAIN_COUNT, RISK_MAX_SCORE, type RiskZoneState } from "@/lib/game-logic/risk-zone/engine";
import type { GameModule } from "@/games/types";
import { spaceThousands } from "@/games/_shared/format";
import { codec } from "./codec";

export type RiskAction = { t: "guess"; c: "higher" | "lower" } | { t: "bank" } | { t: "push" } | { t: "next" };

export const gameModule: GameModule<RiskZoneState, RiskAction> = {
  slug: "risk-zone",
  create(seed) {
    return createRiskZone(mulberry32(seed));
  },
  reduce(s, a) {
    switch (a.t) {
      case "guess":
        return guess(s, a.c);
      case "bank":
        return bank(s);
      case "push":
        return push(s);
      case "next":
        return nextChain(s);
      default:
        return s;
    }
  },
  codec,
  done: (s) => s.phase === "results",
  progress(s) {
    const misses = s.log.map((c, i) => (c.outcome === "wiped" ? i : -1)).filter((i) => i >= 0);
    return {
      done: s.log.length,
      total: RISK_CHAIN_COUNT,
      label: "banked",
      value: String(s.bankedTotal),
      extra: `chain ${Math.min(s.chainIndex + 1, RISK_CHAIN_COUNT)} of ${RISK_CHAIN_COUNT} · pot ${s.pendingPot}`,
      misses,
      current: s.phase === "results" ? null : s.chainIndex,
    };
  },
  verdict(prev, next, a) {
    if (next === prev) return null;
    if (a.t === "guess") return next.lastOutcome === "correct" ? { tone: "good", text: `Right. Pot ${next.pendingPot}.` } : { tone: "bad", text: "Busted. Chain wiped." };
    if (a.t === "bank") return { tone: "good", text: `Banked ${prev.pendingPot}.`, milestone: true };
    return null;
  },
  payload(s, ctx) {
    return {
      gameSlug: "risk-zone",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.bankedTotal,
      scoreMax: RISK_MAX_SCORE,
      scoreSortValue: s.bankedTotal,
      scoreDisplay: `${s.bankedTotal} pts`,
      resultJson: { score: s.bankedTotal, chains: s.log.map((c) => ({ outcome: c.outcome, bankedAt: c.bankedAt, points: c.points })) },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${spaceThousands(s.bankedTotal)} pts`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase === "guess") return { ArrowUp: () => dispatch({ t: "guess", c: "higher" }), ArrowDown: () => dispatch({ t: "guess", c: "lower" }), h: () => dispatch({ t: "guess", c: "higher" }), l: () => dispatch({ t: "guess", c: "lower" }) };
    if (s.phase === "decide") return { b: () => dispatch({ t: "bank" }), p: () => dispatch({ t: "push" }) };
    if (s.phase === "wiped" || s.phase === "banked") return { Enter: () => dispatch({ t: "next" }) };
    return {};
  },
  keyHint: "arrows call · b bank · p push · Enter next",
  keepBoardOnResult: false,
  submits: true,
};

export function multiplierLabel(correct: number): string {
  return `x${riskMultiplier(correct)}`;
}
