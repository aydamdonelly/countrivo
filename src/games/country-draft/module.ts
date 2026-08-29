/*
 * Country Draft (SPEC; blueprint 8.2), the flagship. Five rounds, and every round is one
 * country that puts three of its people on the table, each carrying a different archetype
 * and a standing. You take one and give them one of five seats. The seat decides most of
 * the points, the standing decides the rest, and after five appointments the cabinet is
 * scored out of 195, which is how many of the world's countries it takes.
 *
 * This adapter is pure and React-free: it wraps the engine under
 * src/lib/game-logic/country-draft, so the board, the resume replay and the server
 * validator all read the same deterministic board.
 */
import {
  appoint,
  appointmentsOf,
  canUndo,
  createGame,
  drop,
  figureAt,
  filledSeats,
  hold,
  scoreState,
  seen,
  undo,
} from "@/lib/game-logic/country-draft/engine";
import {
  ARCHETYPE_LABELS,
  MAX_SCORE,
  RESULT_REVEAL_MS,
  ROUNDS,
  SEAT_NAMES,
  bandOf,
  fitWord,
} from "@/lib/game-logic/country-draft/tables";
import { POOL_VERSION } from "@/lib/game-logic/country-draft/roster";
import type { DraftState, PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import { buildCountryDraftShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type CountryDraftAction =
  | { t: "hold"; i: PoolIdx; ui: true }
  | { t: "drop"; ui: true }
  | { t: "appoint"; i: PoolIdx; s: SeatIdx }
  | { t: "undo" }
  | { t: "seen" };

export type { DraftState as CountryDraftState };

export { RESULT_REVEAL_MS };

/** The score a player watches while they play: fits and standings, no bonus until the end. */
export function runningScore(s: DraftState): number {
  return scoreState(s).score;
}

/** The rows the result, the share and the payload all read, in round order. */
export function appointmentRows(s: DraftState) {
  return appointmentsOf(s).map((pick) => {
    const round = s.board.rounds[pick.round];
    const figure = figureAt(s.board, pick);
    return {
      round: pick.round,
      seat: pick.seat,
      iso3: round.iso3,
      iso2: round.iso2,
      country: round.name,
      name: figure.name,
      note: figure.note,
      archetype: ARCHETYPE_LABELS[figure.archetype],
      standing: figure.standing,
      fit: pick.fit,
      standingPoints: pick.standingPoints,
      points: pick.points,
    };
  });
}

/** The same rows for the board's own best line, so a bad run is readable in one screen. */
export function bestRows(s: DraftState) {
  return [...s.board.best]
    .sort((a, b) => a.round - b.round)
    .map((pick) => {
      const round = s.board.rounds[pick.round];
      const figure = round.pool[pick.poolIdx];
      return {
        round: pick.round,
        seat: pick.seat,
        iso3: round.iso3,
        iso2: round.iso2,
        country: round.name,
        name: figure.name,
        archetype: ARCHETYPE_LABELS[figure.archetype],
        standing: figure.standing,
        fit: pick.fit,
        standingPoints: pick.standingPoints,
        points: pick.points,
      };
    });
}

export const gameModule: GameModule<DraftState, CountryDraftAction> = {
  slug: "country-draft",

  create(seed) {
    return createGame(seed);
  },

  reduce(s, a) {
    switch (a.t) {
      case "hold":
        return hold(s, a.i);
      case "drop":
        return drop(s);
      case "appoint":
        return appoint(s, a.i, a.s);
      case "undo":
        return undo(s);
      case "seen":
        return seen(s);
      default:
        return s;
    }
  },

  codec,

  done: (s) => s.phase === "done",

  progress(s) {
    const filled = filledSeats(s);
    const open = ROUNDS - filled;
    const r = scoreState(s);
    return {
      done: filled,
      total: ROUNDS,
      label: "score",
      value: String(r.score),
      extra:
        s.phase === "playing"
          ? `${open} seat${open === 1 ? "" : "s"} open`
          : r.bonusTotal > 0
            ? `bonus +${r.bonusTotal}`
            : "no bonus",
    };
  },

  /**
   * The verdict line is the arithmetic lesson: after five rounds a player has been told
   * the formula five times without reading a guide.
   */
  verdict(prev, next, a) {
    if (a.t === "hold" || a.t === "drop") {
      if (next === prev) return null;
      if (next.held === null) return { tone: "neutral", text: "Back on the table." };
      return { tone: "neutral", text: "Held. Pick a seat." };
    }
    if (a.t === "undo") {
      if (next === prev) return null;
      return { tone: "neutral", text: "Taken back. No take-back left." };
    }
    if (a.t !== "appoint" || next === prev) return null;
    const pick = next.seats[a.s];
    if (!pick) return null;
    const delta = `+${pick.points}`;
    if (next.phase === "reveal") return { tone: "neutral", text: "Final pick in.", delta };
    const word = fitWord(pick.fit);
    const head = pick.fit === 0 ? "Wrong seat." : `${word.charAt(0).toUpperCase()}${word.slice(1)} in ${SEAT_NAMES[a.s]}.`;
    const line = `${head} ${pick.fit} fit, ${pick.standingPoints} standing.`;
    if (pick.fit >= 18) return { tone: "good", text: line, delta };
    if (pick.fit === 0) return { tone: "bad", text: line, delta };
    return { tone: "neutral", text: line, delta };
  },

  /** The reveal window: the board stays live so the last appointment can still go back. */
  after(s) {
    return s.phase === "reveal" ? { ms: RESULT_REVEAL_MS, then: { t: "seen" }, busy: false } : null;
  },

  payload(s, ctx) {
    const r = scoreState(s);
    const gap = s.board.ceiling - r.score;
    return {
      gameSlug: "country-draft",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: r.score,
      scoreMax: MAX_SCORE,
      // Higher is better; the server recomputes this the same way.
      scoreSortValue: r.score,
      scoreDisplay: String(r.score),
      resultJson: {
        poolVersion: POOL_VERSION,
        score: r.score,
        band: bandOf(r.score).key,
        ceiling: s.board.ceiling,
        gap,
        fitTotal: r.fitTotal,
        standingTotal: r.standingTotal,
        bonusTotal: r.bonusTotal,
        bonuses: r.bonuses,
        roundCountries: s.board.rounds.map((x) => x.iso3),
        poolNames: s.board.rounds.flatMap((x) => x.pool.map((p) => p.name)),
        appointments: appointmentRows(s),
        best: bestRows(s),
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => `${scoreState(s).score} of ${MAX_SCORE}`,

  share(s, ctx) {
    const r = scoreState(s);
    return buildCountryDraftShareText(
      {
        score: r.score,
        band: bandOf(r.score).word,
        fits: appointmentsOf(s).map((p) => p.fit),
        rank: ctx.rank,
        practice: ctx.mode === "practice",
      },
      ctx.dateKey,
    );
  },

  /**
   * The digits never collide: the seat numerals are rendered only while someone is held,
   * and the pool numerals only while nobody is.
   */
  keys(s, dispatch) {
    const map: Record<string, () => void> = {};
    if (s.phase === "reveal") map.Enter = () => dispatch({ t: "seen" });
    if (s.phase === "playing" && s.round < ROUNDS) {
      if (s.held === null) {
        s.board.rounds[s.round].pool.forEach((_, i) => {
          map[String(i + 1)] = () => dispatch({ t: "hold", i: i as PoolIdx, ui: true });
        });
      } else {
        const held = s.held;
        s.seats.forEach((seat, i) => {
          if (seat === null) map[String(i + 1)] = () => dispatch({ t: "appoint", i: held, s: i as SeatIdx });
        });
        map.Escape = () => dispatch({ t: "drop", ui: true });
      }
    }
    if (canUndo(s)) {
      map.u = () => dispatch({ t: "undo" });
      map.U = () => dispatch({ t: "undo" });
    }
    return map;
  },

  keyHint: "1 to 3 take · 1 to 5 seat · Esc drop · U take back",
  keepBoardOnResult: true,
  submits: true,
};
