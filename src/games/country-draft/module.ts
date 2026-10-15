import { appoint, appointmentsOf, chooseCountry, chooseSeat, countryAt, createGame, drop, figureAt, filledSeats, hold, nextRound, openCountry, scoreState, seen } from "@/lib/game-logic/country-draft/engine";
import { MAX_SCORE, ROUNDS, SEAT_NAMES, bandOf, fitWord } from "@/lib/game-logic/country-draft/tables";
import { POOL_VERSION } from "@/lib/game-logic/country-draft/roster";
import { whyLine, whySource } from "@/lib/game-logic/country-draft/scoring";
import type { DraftState, PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import { buildCountryDraftShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type CountryDraftAction =
  | { t: "choose-country"; c: PoolIdx; ui: true }
  | { t: "open"; c: PoolIdx }
  | { t: "hold"; i: PoolIdx; ui: true }
  | { t: "select-seat"; s: SeatIdx; ui: true }
  | { t: "drop"; ui: true }
  | { t: "appoint"; i: PoolIdx; s: SeatIdx }
  | { t: "next" }
  | { t: "seen" };
export type DraftCommitAction = Extract<CountryDraftAction, { t: "open" | "appoint" | "next" }>;
export type { DraftState as CountryDraftState };
export function runningScore(s: DraftState): number { return scoreState(s).score; }

export function appointmentRows(s: DraftState) {
  return appointmentsOf(s).map((pick) => {
    const country = countryAt(s.board, pick);
    const figure = figureAt(s.board, pick);
    return { round: pick.round, countryIdx: pick.countryIdx, poolIdx: pick.poolIdx, seat: pick.seat, iso3: country.iso3, iso2: country.iso2, country: country.name, region: country.region, name: figure.name, slug: figure.slug, note: figure.note, era: figure.era, standing: figure.standing, fit: pick.fit, standingPoints: pick.standingPoints, points: pick.points, why: whyLine(figure, pick.seat, pick.fit), source: whySource(figure, pick.seat) };
  });
}

export function bestRows(s: DraftState) {
  return [...s.board.best].sort((a, b) => a.round - b.round).map((pick) => {
    const country = countryAt(s.board, pick);
    const figure = figureAt(s.board, pick);
    return { round: pick.round, countryIdx: pick.countryIdx, poolIdx: pick.poolIdx, seat: pick.seat, iso3: country.iso3, iso2: country.iso2, country: country.name, name: figure.name, fit: pick.fit, standingPoints: pick.standingPoints, points: pick.points };
  });
}

export const gameModule: GameModule<DraftState, CountryDraftAction> = {
  slug: "country-draft",
  contentVersion: POOL_VERSION,
  create: (seed) => createGame(seed),
  reduce(s, a) {
    switch (a.t) {
      case "choose-country": return chooseCountry(s, a.c);
      case "open": return openCountry(s, a.c);
      case "hold": return hold(s, a.i);
      case "select-seat": return chooseSeat(s, a.s);
      case "drop": return drop(s);
      case "appoint": return appoint(s, a.i, a.s);
      case "next": return nextRound(s);
      case "seen": return seen(s);
      default: return s;
    }
  },
  codec,
  done: (s) => s.phase === "done",
  progress(s) { return { done: filledSeats(s), total: ROUNDS, label: "score", value: `${scoreState(s).score} of ${MAX_SCORE}`, extra: `Round ${Math.min(s.round + 1, ROUNDS)} of ${ROUNDS}` }; },
  verdict(prev, next, a) {
    if (next === prev || a.t !== "appoint") return null;
    const pick = next.seats[a.s];
    if (!pick) return null;
    return { tone: pick.fit >= 18 ? "good" : pick.fit <= 6 ? "bad" : "neutral", text: `${fitWord(pick.fit)} in ${SEAT_NAMES[a.s]}: fit ${pick.fit}, fame ${pick.standingPoints}.`, delta: `+${pick.points}` };
  },
  payload(s, ctx) {
    const scored = scoreState(s);
    return { gameSlug: "country-draft", mode: ctx.mode, dateKey: ctx.dateKey, scoreRaw: scored.score, scoreMax: MAX_SCORE, scoreSortValue: scored.score, scoreDisplay: String(scored.score), resultJson: { poolVersion: POOL_VERSION, score: scored.score, band: bandOf(scored.score).key, fitTotal: scored.fitTotal, standingTotal: scored.standingTotal, bonusTotal: scored.bonusTotal, bonuses: scored.bonuses, roundCountries: appointmentsOf(s).map((p) => countryAt(s.board, p).iso3), appointments: appointmentRows(s) }, startedAt: ctx.startedAt };
  },
  scoreLabel: (s) => `${scoreState(s).score} of ${MAX_SCORE}`,
  share(s, ctx) { return buildCountryDraftShareText({ score: scoreState(s).score, band: bandOf(scoreState(s).score).word, fits: appointmentsOf(s).map((p) => p.fit), rank: ctx.rank, practice: ctx.mode === "practice" }, ctx.dateKey); },
  keyHint: "1 to 3 choose · Enter confirm · Esc put back · N next country",
  keepBoardOnResult: false,
  submits: true,
};
