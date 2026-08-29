import { mulberry32 } from "@/lib/seeded-random";
import { getCountryByIso3 } from "@/lib/data/countries";
import { answerCountry, createGeoWordle, guessesUsed, submitGuess, MAX_GUESSES, type GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { buildGeoWordleShareText } from "@/lib/share";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type GeoAction = { t: "guess"; iso3: string };

export function kmLabel(km: number): string {
  return `${Math.round(km).toLocaleString("en-US").replace(/,/g, " ")} km`;
}

export const module: GameModule<GeoWordleState, GeoAction> = {
  slug: "geo-wordle",
  create(seed) {
    return createGeoWordle(mulberry32(seed));
  },
  reduce(s, a) {
    if (a.t !== "guess") return s;
    const country = getCountryByIso3(a.iso3);
    return country ? submitGuess(s, country) : s;
  },
  codec,
  done: (s) => s.phase !== "playing",
  progress(s) {
    return { done: s.guesses.length, total: MAX_GUESSES, label: "guess", value: `${Math.min(s.guesses.length + 1, MAX_GUESSES)} of ${MAX_GUESSES}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "guess") return null;
    if (next === prev) {
      if (prev.guesses.some((g) => g.iso3 === a.iso3)) return { tone: "bad", text: "Already guessed." };
      return { tone: "bad", text: "Not a country." };
    }
    const g = next.guesses[next.guesses.length - 1];
    if (g.correct) return { tone: "good", text: "Solved." };
    return { tone: "neutral", text: `${g.name} is ${kmLabel(g.distanceKm)} ${g.direction} of the answer.` };
  },
  payload(s, ctx) {
    const used = guessesUsed(s);
    const won = s.phase === "won";
    return {
      gameSlug: "geo-wordle",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: used,
      scoreMax: MAX_GUESSES,
      scoreSortValue: MAX_GUESSES - used,
      scoreDisplay: won ? `${used}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`,
      resultJson: {
        answerIso3: s.answerIso3,
        won,
        guesses: s.guesses.map((g) => ({ iso3: g.iso3, distanceKm: g.distanceKm, proximityPct: g.proximityPct, arrow: g.arrow, band: g.band, correct: g.correct })),
      },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => (s.phase === "won" ? `${guessesUsed(s)}/${MAX_GUESSES}` : s.phase === "lost" ? `X/${MAX_GUESSES}` : `${s.guesses.length}/${MAX_GUESSES}`),
  share: (s, ctx) => buildGeoWordleShareText({ won: s.phase === "won", guesses: s.guesses }, ctx.dateKey),
  keepBoardOnResult: true,
  submits: true,
};

export function answerName(s: GeoWordleState): string {
  return answerCountry(s)?.displayName ?? "the answer";
}
