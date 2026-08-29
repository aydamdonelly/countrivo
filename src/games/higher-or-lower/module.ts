/*
 * Higher or Lower (blueprint 8.8): two countries, one stat, call which of the two ranks
 * higher. A wrong call ends the streak. The pure engine
 * (src/lib/game-logic/higher-or-lower/engine.ts) precomputes 80 rounds from the seed and
 * advances on `guess`; this adapter adds the one thing the board needs and the engine has no
 * concept of, the 1500 ms reveal (blueprint 8.5): the call is held in `pending` while the
 * hidden value counts up, and the engine only sees it when the host dispatches `advance` at
 * the end of the window (replay applies that at once, so a resumed board waits on nothing).
 */
import { mulberry32 } from "@/lib/seeded-random";
import { formatStat } from "@/lib/utils";
import { createHoL, guess, type HoLRound, type HoLState as EngineState } from "@/lib/game-logic/higher-or-lower/engine";
import { buildShareGrid } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type Call = "higher" | "lower";

/** The two options in the order the board renders them: 0 higher, 1 lower. */
export const CALLS: readonly Call[] = ["higher", "lower"];

/** How long the answered pair stays on screen before the engine takes the call (blueprint 8.5). */
export const REVEAL_MS = 1500;

export interface HoLState {
  g: EngineState;
  /** The call during the reveal window; the engine takes it on `advance`. */
  pending: Call | null;
}

export type HoLAction = { t: "guess"; c: Call } | { t: "advance"; ui: true };

const ADVANCE: HoLAction = { t: "advance", ui: true };

/** The engine state as it stands once the reveal is over. */
export function settled(s: HoLState): EngineState {
  return s.pending === null ? s.g : guess(s.g, s.pending);
}

function commit(s: HoLState): HoLState {
  return s.pending === null ? s : { g: settled(s), pending: null };
}

/**
 * The unit printed beside a pair value. The stat line above the pair already names the
 * measure, so the three units that would wrap a 22 px Erode numeral onto a second line in a
 * 165 px column ("1.1M arrivals/year", "4.6 births/woman", "84.5M people") are dropped and
 * the number stands alone. `%`, `years`, `km²` and `USD` stay: they carry meaning the stat
 * line does not.
 */
const DROPPED_UNITS = new Set(["people", "births/woman", "arrivals/year"]);

export function pairUnit(unit: string): string {
  return DROPPED_UNITS.has(unit) ? "" : unit;
}

/**
 * `41.6%`, `84.5 years`, `1.1M`, `4.556`: the house formatter with no dangling space when the
 * unit is dropped. The figures are printed at the precision the data carries and are never
 * rounded further: a fertility pair is often decided in the second decimal (rounding the
 * category to one would print the same number on both sides of 4 rounds in 100), and a pair
 * that reads as a tie is a round the player cannot call.
 */
export function pairValue(value: number, unit: string): string {
  return formatStat(value, pairUnit(unit)).trimEnd();
}

/** The pair on screen: during the reveal it is still the round that was just called. */
export function roundInView(s: HoLState): HoLRound {
  return s.g.rounds[Math.min(s.g.currentRound, s.g.rounds.length - 1)];
}

export interface CalledRound {
  index: number;
  round: HoLRound;
  call: Call;
  ok: boolean;
}

/**
 * Every round the player answered, oldest first. A correct call is the round's own answer;
 * the round that ended the streak is the only wrong one, so its call is the other side.
 */
export function callLog(g: EngineState): CalledRound[] {
  const out: CalledRound[] = [];
  for (let i = 0; i < g.currentRound && i < g.rounds.length; i += 1) {
    out.push({ index: i, round: g.rounds[i], call: g.rounds[i].answer, ok: true });
  }
  if (g.lastAnswer === "wrong" && g.currentRound < g.rounds.length) {
    const round = g.rounds[g.currentRound];
    out.push({ index: g.currentRound, round, call: round.answer === "higher" ? "lower" : "higher", ok: false });
  }
  return out;
}

export const gameModule: GameModule<HoLState, HoLAction> = {
  slug: "higher-or-lower",
  create(seed) {
    return { g: createHoL(mulberry32(seed)), pending: null };
  },
  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "guess") {
      const base = commit(s);
      if (base.g.phase !== "playing") return base;
      return { g: base.g, pending: a.c };
    }
    return s;
  },
  codec,
  feedback: { ms: REVEAL_MS, inWindow: (s) => s.pending !== null, advance: ADVANCE },
  // A deck the generator could not fill (every candidate pair tied) has nothing to play, so
  // it is finished on arrival rather than rendering a board with no round in it.
  done: (s) => s.g.rounds.length === 0 || (s.pending === null && s.g.phase === "gameover"),
  /*
   * The session line: the burning flame, `streak`, the numeral, and no pips (blueprint 8.8
   * also asks for `best 22` beside it, but the engine's bestStreak only ever equals the
   * running streak, so it would print the same number twice, and the viewer's own best
   * across sessions never reaches `progress`, which sees the state alone).
   */
  progress(s) {
    const g = settled(s);
    return { done: g.streak, label: "streak", value: String(g.streak), flame: true };
  },
  verdict(prev, next, a) {
    if (a.t !== "guess" || next.pending === null) return null;
    const round = roundInView(next);
    if (next.pending !== round.answer) return { tone: "bad", text: "Wrong. Streak ends." };
    return { tone: "good", text: "Right.", milestone: (next.g.streak + 1) % 5 === 0 };
  },
  payload(s, ctx) {
    const g = settled(s);
    return {
      gameSlug: "higher-or-lower",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.streak,
      scoreMax: g.streak,
      scoreSortValue: g.streak,
      scoreDisplay: `Streak: ${g.streak}`,
      resultJson: { streak: g.streak, bestStreak: g.bestStreak, totalRounds: g.rounds.length, lastAnswer: g.lastAnswer },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${settled(s).streak} in a row`,
  share(s, ctx) {
    // A streak has no fixed maximum, so the share carries the brag line without a grid row
    // (the rule buildShareGrid documents for open-ended scores).
    return buildShareGrid({
      gameTitle: ctx.title,
      gameSlug: "higher-or-lower",
      scoreDisplay: `${settled(s).streak} in a row`,
      dateKey: ctx.dateKey,
      practice: ctx.mode === "practice",
    });
  },
  keys(s, dispatch): Record<string, () => void> {
    if (s.pending !== null || s.g.phase !== "playing") return {};
    return {
      ArrowUp: () => dispatch({ t: "guess", c: "higher" }),
      ArrowDown: () => dispatch({ t: "guess", c: "lower" }),
    };
  },
  keyHint: "arrow up higher · arrow down lower",
  keepBoardOnResult: false,
  submits: true,
};
