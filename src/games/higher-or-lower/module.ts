/*
 * Higher or Lower (concept 5.5, panes HL1 and HL2). The pure engine
 * (src/lib/game-logic/higher-or-lower/engine.ts) deals the chain and scores the calls; this
 * adapter adds the two timed beats the board needs and the engine has no notion of:
 *
 * - the reveal: a call opens a window (`rev`) in which the right value ticks in for 900 ms
 *   and the verdict and the comparison line hold for 1.2 s. The host dispatches `advance`
 *   at its end; a tap after the tick skips the hold. Replay applies `advance` at once, so a
 *   resumed board lands on its next pair.
 * - the deal lock: after `advance` the new pair ignores input for 300 ms (`fresh`), held as
 *   the module's `after` window so the host keeps the buttons and the keys busy.
 *
 * The call itself is persisted; `advance` and `ready` are ui actions and never are.
 */
import {
  DAILY_MAX,
  answerAt,
  createDaily,
  createPractice,
  dailyPoints,
  hitAt,
  isOver,
  makeCall,
  statTable,
  streak,
  totalCalls,
  worth,
  type Call,
  type HoLCard,
  type HoLGame,
} from "@/lib/game-logic/higher-or-lower/engine";
import { cardValue, lineValue, statMeta } from "@/lib/game-logic/higher-or-lower/stats";
import { mulberry32 } from "@/lib/seeded-random";
import { buildHigherOrLowerShareText } from "@/lib/share/higher-or-lower";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type { Call } from "@/lib/game-logic/higher-or-lower/engine";

/** The value ticks in over this, whatever its size (concept 3.7: fixed, so it leaks nothing). */
export const TICK_MS = 900;
/** The verdict and the comparison line hold this long before the next pair is dealt. */
export const HOLD_MS = 1200;
export const REVEAL_MS = TICK_MS + HOLD_MS;
/** A newly dealt pair ignores input this long (concept 3.7). */
export const DEAL_LOCK_MS = 300;

export interface HoLState {
  g: HoLGame;
  /** The last call is on screen and its value is being revealed. */
  rev: boolean;
  /** A pair was just dealt; input waits for `ready`. */
  fresh: boolean;
}

export type HoLAction = { t: "guess"; c: Call } | { t: "advance"; ui: true } | { t: "ready"; ui: true };

export const ADVANCE: HoLAction = { t: "advance", ui: true };
const READY: HoLAction = { t: "ready", ui: true };

/** The call on screen: during the reveal it is the one just made, else the next one. */
export function callInView(s: HoLState): number {
  const i = s.rev ? s.g.calls.length - 1 : s.g.calls.length;
  return Math.max(0, Math.min(i, s.g.chain.length - 2));
}

export interface PairView {
  index: number;
  left: HoLCard;
  right: HoLCard;
  answer: Call;
}

export function pairInView(s: HoLState): PairView {
  const i = callInView(s);
  return { index: i, left: s.g.chain[i], right: s.g.chain[i + 1], answer: answerAt(s.g, i) };
}

/** The calls whose reveal is over, so the header never tells the verdict before the board does. */
export function settledCalls(s: HoLState): number {
  return s.rev ? s.g.calls.length - 1 : s.g.calls.length;
}

/** `Denmark: 5.95 million. Norway: 5.52 million.` Generated from the data, never typed. */
export function comparisonLine(g: HoLGame, i: number): string {
  const l = g.chain[i];
  const r = g.chain[i + 1];
  return `${r.name}: ${lineValue(g.stat, r.value)}. ${l.name}: ${lineValue(g.stat, l.value)}.`;
}

/** `Source: World Bank, 2023`. */
export function sourceLine(g: HoLGame): string {
  const t = statTable(g.stat);
  return `Source: ${t.source}, ${t.year}`;
}

/** `Population, 2023`. */
export function statLine(g: HoLGame): string {
  return `${statMeta(g.stat).label}, ${statTable(g.stat).year}`;
}

/** `People, 2023`. */
export function unitLine(g: HoLGame): string {
  return `${statMeta(g.stat).unit}, ${statTable(g.stat).year}`;
}

export { cardValue };

export interface CallRow {
  index: number;
  left: HoLCard;
  right: HoLCard;
  call: Call;
  ok: boolean;
  points: number;
}

/** Every call made, oldest first. */
export function callLog(g: HoLGame): CallRow[] {
  return g.calls.map((call, i) => ({
    index: i,
    left: g.chain[i],
    right: g.chain[i + 1],
    call,
    ok: hitAt(g, i),
    points: g.mode === "daily" && hitAt(g, i) ? worth(i) : 0,
  }));
}

/** The right call for the pair on screen (the contract driver plays with it). */
export function currentAnswer(s: HoLState): Call {
  return answerAt(s.g, Math.min(s.g.calls.length, s.g.chain.length - 2));
}

function commit(s: HoLState): HoLState {
  return s.rev ? { g: s.g, rev: false, fresh: !isOver(s.g) } : s;
}

export function scoreText(g: HoLGame): string {
  return g.mode === "daily" ? `${dailyPoints(g)} of ${DAILY_MAX}` : `${streak(g)} in a row`;
}

export const gameModule: GameModule<HoLState, HoLAction> = {
  slug: "higher-or-lower",
  create(seed, mode, dateKey) {
    const rng = mulberry32(seed);
    const g = mode === "daily" ? createDaily(rng, dateKey) : createPractice(rng, dateKey);
    return { g, rev: false, fresh: false };
  },
  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "ready") return s.fresh ? { ...s, fresh: false } : s;
    if (a.t === "guess") {
      const base = commit(s);
      if (isOver(base.g)) return base;
      return { g: makeCall(base.g, a.c), rev: true, fresh: false };
    }
    return s;
  },
  codec,
  feedback: { ms: REVEAL_MS, inWindow: (s) => s.rev, advance: ADVANCE },
  after: (s) => (s.fresh ? { ms: DEAL_LOCK_MS, then: READY, busy: true } : null),
  done: (s) => !s.rev && isOver(s.g),
  progress(s) {
    const n = settledCalls(s);
    const g: HoLGame = n === s.g.calls.length ? s.g : { ...s.g, calls: s.g.calls.slice(0, n) };
    if (g.mode === "practice") return { done: streak(g), label: "streak", value: String(streak(g)), flame: true };
    const misses: number[] = [];
    for (let i = 0; i < n; i += 1) if (!hitAt(g, i)) misses.push(i);
    return { done: n, total: totalCalls(g), label: "score", value: String(dailyPoints(g)), extra: `of ${DAILY_MAX}`, misses };
  },
  // The verdict word lives on the right card once the value has ticked in (HL2). The host
  // line stays empty; the neutral tone gives the commit its light tap and nothing more, so
  // no sound or haptic tells the answer before the number does.
  verdict(prev, next, a) {
    if (a.t !== "guess" || !next.rev || next === prev) return null;
    return { tone: "neutral", text: "" };
  },
  payload(s, ctx) {
    const g = s.g;
    const calls = g.calls.map((c) => (c === "higher" ? "h" : "l")).join("");
    if (g.mode === "daily") {
      const points = dailyPoints(g);
      return {
        gameSlug: "higher-or-lower",
        mode: ctx.mode,
        dateKey: ctx.dateKey,
        scoreRaw: points,
        scoreMax: DAILY_MAX,
        scoreSortValue: points,
        scoreDisplay: `${points} of ${DAILY_MAX}`,
        resultJson: {
          stat: g.stat,
          points,
          calls,
          hits: g.calls.map((_, i) => hitAt(g, i)),
          chain: g.chain.map((c) => c.iso3),
        },
        startedAt: ctx.startedAt,
      };
    }
    const n = streak(g);
    return {
      gameSlug: "higher-or-lower",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: n,
      scoreMax: n,
      scoreSortValue: n,
      scoreDisplay: `${n} in a row`,
      resultJson: { stat: g.stat, streak: n, calls },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => scoreText(s.g),
  share(s, ctx) {
    const g = s.g;
    return buildHigherOrLowerShareText({
      practice: ctx.mode === "practice" || g.mode === "practice",
      dateKey: ctx.dateKey,
      noun: statMeta(g.stat).noun,
      points: dailyPoints(g),
      max: DAILY_MAX,
      streak: streak(g),
      hits: g.calls.map((_, i) => hitAt(g, i)),
    });
  },
  keys(s, dispatch): Record<string, () => void> {
    if (s.rev || s.fresh || isOver(s.g)) return {};
    const higher = () => dispatch({ t: "guess", c: "higher" });
    const lower = () => dispatch({ t: "guess", c: "lower" });
    return { ArrowUp: higher, h: higher, H: higher, ArrowDown: lower, l: lower, L: lower };
  },
  // The hint sits inside the board, under the left card on desktop (HL1), not in the host row.
  keepBoardOnResult: false,
  submits: true,
};
