import { mulberry32 } from "@/lib/seeded-random";
import { getCountryByIso3 } from "@/lib/data/countries";
import {
  answerCountry,
  createGeoWordle,
  guessesUsed,
  submitGuess,
  MAX_GUESSES,
  type GeoWordleState,
} from "@/lib/game-logic/geo-wordle/engine";
import { buildGeoWordleShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

/**
 * One guess (`iso3` is always three uppercase letters, so the log token is `g{ISO}`), or a
 * word the board refused before it ever reached the engine. The refusal changes nothing and
 * is never persisted; it exists so a rejected input still carries the wrong sound and clears
 * a verdict that belongs to an older guess.
 */
export type GeoAction = { t: "guess"; iso3: string } | { t: "reject"; ui: true };

export const REJECTED: GeoAction = { t: "reject", ui: true };

/**
 * `2 340 km`. Grouped by hand rather than through `toLocaleString`, so the server and the
 * client always produce the same string whatever locale data Node happens to carry.
 */
export function kmLabel(km: number): string {
  const n = String(Math.max(0, Math.round(km))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n} km`;
}

/** The smallest distance among the guesses, or null before the first one. */
export function closestKm(state: GeoWordleState): number | null {
  if (state.guesses.length === 0) return null;
  return state.guesses.reduce((min, g) => Math.min(min, g.distanceKm), Infinity);
}

/** The secret country's display name, once the board is finished. */
export function answerName(state: GeoWordleState): string {
  return answerCountry(state)?.displayName ?? "the answer";
}

/**
 * GeoWordle (blueprint 8.8): a hidden country, six tries, every guess resolved to a
 * distance, a bearing and a proximity band. The engine is pure and seeded, so
 * `create(dateSeed(dateKey + edition))` gives every player in the world the same answer.
 */
export const gameModule: GameModule<GeoWordleState, GeoAction> = {
  slug: "geo-wordle",

  create(seed) {
    return createGeoWordle(mulberry32(seed));
  },

  reduce(state, action) {
    if (action.t !== "guess") return state;
    const country = getCountryByIso3(action.iso3);
    return country ? submitGuess(state, country) : state;
  },

  codec,

  done: (state) => state.phase !== "playing",

  progress(state) {
    const played = state.guesses.length;
    const finished = state.phase !== "playing";
    // While the board is live the value is the guess you are on; once it is over it is the
    // number you used, and no pip is left burning as the current one.
    return {
      done: played,
      total: MAX_GUESSES,
      label: "guess",
      value: `${finished ? guessesUsed(state) : Math.min(played + 1, MAX_GUESSES)} of ${MAX_GUESSES}`,
      current: finished ? null : played,
    };
  },

  /*
   * The line under the map already states the distance and the direction of the last guess,
   * so the verdict line carries what that line cannot: whether the guess moved you closer
   * than the one before it, and by how much. An input the engine refuses (an unknown name, a
   * repeat) keeps its message under the field where it was typed, and the verdict carries the
   * tone alone, so the wrong sound still plays and no stale line is left standing.
   */
  verdict(prev, next, action) {
    if (action.t === "reject") return { tone: "bad", text: "" };
    if (next === prev) return { tone: "bad", text: "" };
    const guess = next.guesses[next.guesses.length - 1];
    if (guess.correct) return { tone: "good", text: "Solved." };
    if (next.phase === "lost") return { tone: "bad", text: "Out of guesses." };
    const before = prev.guesses[prev.guesses.length - 1];
    const left = MAX_GUESSES - next.guesses.length;
    const remaining = `${left} ${left === 1 ? "guess" : "guesses"} left.`;
    if (!before) return { tone: "neutral", text: remaining };
    const diff = guess.distanceKm - before.distanceKm;
    if (diff === 0) return { tone: "neutral", text: `Same distance. ${remaining}` };
    return {
      tone: "neutral",
      text: `${diff < 0 ? "Closer." : "Further."} ${remaining}`,
      delta: `${diff < 0 ? "-" : "+"}${kmLabel(Math.abs(diff))}`,
    };
  },

  payload(state, ctx) {
    const used = guessesUsed(state);
    const won = state.phase === "won";
    return {
      gameSlug: "geo-wordle",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: used,
      scoreMax: MAX_GUESSES,
      scoreSortValue: MAX_GUESSES - used,
      scoreDisplay: won ? `${used}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`,
      resultJson: {
        answerIso3: state.answerIso3,
        won,
        guesses: state.guesses.map((g) => ({
          iso3: g.iso3,
          distanceKm: g.distanceKm,
          proximityPct: g.proximityPct,
          arrow: g.arrow,
          band: g.band,
          correct: g.correct,
        })),
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel(state) {
    if (state.phase === "won") return `${guessesUsed(state)}/${MAX_GUESSES}`;
    if (state.phase === "lost") return `X/${MAX_GUESSES}`;
    return `${state.guesses.length}/${MAX_GUESSES}`;
  },

  share: (state, ctx) =>
    buildGeoWordleShareText({ won: state.phase === "won", guesses: state.guesses }, ctx.dateKey),

  keyHint: "Enter guess · Tab fill",
  keepBoardOnResult: true,
  submits: true,
};
