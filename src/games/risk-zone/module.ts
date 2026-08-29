/*
 * Risk Zone (blueprint 8.8): five chains of higher-or-lower calls. Every correct call
 * lifts the multiplier and the pot; you either bank the pot or push for one more reveal,
 * and one wrong call wipes the chain. The pure engine
 * (src/lib/game-logic/risk-zone/engine.ts) owns the chains, the ladder and the phases;
 * this adapter is the thin layer the frame needs: a deterministic `create`, a reducer over
 * the four engine calls, the session line, the verdicts, the payload and the keys.
 *
 * There is no feedback window here (blueprint 8.5 lists risk-zone as 0 ms): every phase
 * change is a control the player presses, so `busy` is never held and a resumed log lands
 * exactly where it left off.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { formatStat } from "@/lib/utils";
import {
  bank,
  createRiskZone,
  guess,
  nextChain,
  push,
  riskMultiplier,
  RISK_CHAIN_COUNT,
  RISK_MAX_SCORE,
  type RiskChain,
  type RiskStep,
  type RiskZoneState,
} from "@/lib/game-logic/risk-zone/engine";
import { buildShareGrid } from "@/lib/share";
import type { Country } from "@/types/country";
import type { GameModule } from "@/games/types";
import { spaceThousands, statLabel } from "@/games/_shared/format";
import { codec } from "./codec";

export type Call = "higher" | "lower";

/** The two options in the order the board renders them: 0 higher, 1 lower. */
export const CALLS: readonly Call[] = ["higher", "lower"];

export type RiskAction = { t: "guess"; c: Call } | { t: "bank" } | { t: "push" } | { t: "next" };

/** The pot is money in hand only while a chain is running; a wipe or a bank clears it. */
function potLive(s: RiskZoneState): boolean {
  return s.phase === "guess" || s.phase === "decide";
}

/**
 * The unit printed beside a pair value. The stat line above the pair already names the
 * measure, so the three units that would wrap a 22 px Erode numeral onto a second line in a
 * 165 px column ("84.5M people", "4.6 births/woman", "1.1M arrivals/year") are dropped and
 * the number stands alone. `%`, `years`, `km²` and `USD` stay: they carry meaning the stat
 * line does not.
 */
const DROPPED_UNITS = new Set(["people", "births/woman", "arrivals/year"]);

export function pairUnit(unit: string): string {
  return DROPPED_UNITS.has(unit) ? "" : unit;
}

/** `41.6%`, `84.5 years`, `1.1M`: the house formatter with no dangling space when the unit is dropped. */
export function pairValue(value: number, unit: string): string {
  return formatStat(value, pairUnit(unit)).trimEnd();
}

/** `x2.25`: the multiplier the pot currently stands on. */
export function multiplierLabel(correct: number): string {
  return `x${riskMultiplier(correct)}`;
}

export interface StepInView {
  chain: RiskChain;
  /** The reveal on screen: the next one while guessing, the last one once it is out. */
  step: RiskStep;
  /** The country the call is measured against: the chain's base, then each revealed country. */
  anchor: Country;
  anchorValue: number;
  /** True once the challenger's value is out (every phase but `guess`). */
  revealed: boolean;
  /** The last step of the chain: a correct call banks it and no push is offered. */
  last: boolean;
}

/**
 * Everything the board draws, derived from the engine state alone. While guessing that is
 * the step at `stepIndex`; afterwards it is `lastReveal`, whose position in the chain gives
 * the anchor it was called against (the engine advances `stepIndex` on a push, not on a
 * reveal, so the index cannot be read off the phase).
 */
export function stepInView(s: RiskZoneState): StepInView {
  const chain = s.chains[Math.min(s.chainIndex, s.chains.length - 1)];
  const guessing = s.phase === "guess";
  const fallback = chain.steps[Math.min(s.stepIndex, chain.steps.length - 1)];
  const step = guessing ? fallback : s.lastReveal ?? fallback;
  const at = Math.max(0, chain.steps.indexOf(step));
  const previous = at > 0 ? chain.steps[at - 1] : null;
  return {
    chain,
    step,
    anchor: previous ? previous.challenger : chain.base,
    anchorValue: previous ? previous.challengerValue : chain.baseValue,
    revealed: !guessing,
    last: at === chain.steps.length - 1,
  };
}

/** The five result rows: the chain's stat, what it paid and where it stopped. */
export interface ChainRow {
  index: number;
  stat: string;
  outcome: "banked" | "wiped";
  points: number;
  /** Correct calls before the chain closed. */
  correct: number;
  multiplier: string;
}

export function chainRows(s: RiskZoneState): ChainRow[] {
  return s.log.map((c, i) => {
    const chain = s.chains[i];
    return {
      index: i,
      stat: chain ? statLabel(chain.category.slug, chain.category.shortLabel) : c.category,
      outcome: c.outcome,
      points: c.points,
      correct: c.bankedAt,
      multiplier: multiplierLabel(c.bankedAt),
    };
  });
}

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
  /*
   * The session line (blueprint 8.8): `chain 2 of 5` is the five pips, a wiped chain among
   * them drawn as the ember outline; then the pot at stake in Erode and the banked total
   * beside it. The pot reads 0 the moment a chain closes, because it has either been wiped
   * or already counted into `banked`.
   */
  progress(s) {
    const total = s.chains.length || RISK_CHAIN_COUNT;
    const misses = s.log.map((c, i) => (c.outcome === "wiped" ? i : -1)).filter((i) => i >= 0);
    return {
      done: s.log.length,
      total,
      label: "pot",
      value: spaceThousands(potLive(s) ? s.pendingPot : 0),
      extra: `banked ${spaceThousands(s.bankedTotal)}`,
      misses,
      current: potLive(s) ? s.chainIndex : null,
    };
  },
  verdict(prev, next, a) {
    if (next === prev) return null;
    if (a.t === "guess") {
      if (next.phase === "wiped") return { tone: "bad", text: "Busted. Chain wiped." };
      // The seventh correct call tops the ladder out and banks the chain on its own.
      if (next.phase === "banked") return { tone: "good", text: `Banked ${spaceThousands(next.pendingPot)}.`, milestone: true };
      return { tone: "good", text: `Right. Pot ${spaceThousands(next.pendingPot)}.` };
    }
    if (a.t === "bank") return { tone: "good", text: `Banked ${spaceThousands(next.pendingPot)}.`, milestone: true };
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
      resultJson: {
        score: s.bankedTotal,
        chains: s.log.map((c) => ({ outcome: c.outcome, bankedAt: c.bankedAt, points: c.points })),
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${spaceThousands(s.bankedTotal)} pts`,
  /** The clipboard grid is the five chains, banked against wiped; the points carry the brag. */
  share(s, ctx) {
    return buildShareGrid({
      gameTitle: ctx.title,
      gameSlug: "risk-zone",
      scoreDisplay: `${spaceThousands(s.bankedTotal)} pts`,
      numericScore: s.log.filter((c) => c.outcome === "banked").length,
      maxScore: s.chains.length || RISK_CHAIN_COUNT,
      dateKey: ctx.dateKey,
      practice: ctx.mode === "practice",
    });
  },
  keys(s, dispatch): Record<string, () => void> {
    if (s.phase === "guess") {
      return {
        ArrowUp: () => dispatch({ t: "guess", c: "higher" }),
        ArrowDown: () => dispatch({ t: "guess", c: "lower" }),
      };
    }
    if (s.phase === "decide") {
      return { b: () => dispatch({ t: "bank" }), p: () => dispatch({ t: "push" }) };
    }
    if (s.phase === "wiped" || s.phase === "banked") {
      return { Enter: () => dispatch({ t: "next" }) };
    }
    return {};
  },
  keyHint: "arrows call · b bank · p push · Enter next",
  keepBoardOnResult: false,
  submits: true,
};
