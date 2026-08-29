import { createSprint, finishSprint, guessCountry, pickContinent, CONTINENTS, type Continent, type SprintState } from "@/lib/game-logic/continent-sprint/engine";
import type { GameModule } from "@/games/types";
import { mmss } from "@/games/_shared/format";
import { codec } from "./codec";

export type SprintAction = { t: "start"; continent: Continent; now: number } | { t: "found"; iso3: string } | { t: "tick"; now: number; ui: true } | { t: "finish"; now: number };

/** The five playable continents (Antarctica has no countries to name). */
export const SPRINT_CONTINENTS = CONTINENTS.filter((c) => c !== "Antarctica");

export const module: GameModule<SprintState, SprintAction> = {
  slug: "continent-sprint",
  create() {
    return createSprint();
  },
  reduce(s, a) {
    switch (a.t) {
      case "start":
        return s.phase === "picking" ? { ...pickContinent(s, a.continent), startTime: a.now, elapsed: 0 } : s;
      case "found":
        return guessCountry(s, a.iso3);
      case "tick":
        return s.phase === "playing" ? { ...s, elapsed: Math.max(0, a.now - s.startTime) } : s;
      case "finish":
        return s.phase === "playing" ? { ...finishSprint(s), elapsed: Math.max(0, a.now - s.startTime) } : s;
      default:
        return s;
    }
  },
  codec,
  persist: () => false,
  done: (s) => s.phase === "results",
  progress(s) {
    if (s.phase === "picking") return { done: 0, label: "pick", value: "a continent" };
    return { done: s.found.length, total: s.allCountries.length, bar: true, label: "named", value: `${s.found.length} of ${s.allCountries.length}`, extra: mmss(s.elapsed) };
  },
  verdict(prev, next, a) {
    if (a.t !== "found") return null;
    if (next !== prev) return { tone: "good", text: "Found." };
    if (prev.found.includes(a.iso3)) return { tone: "neutral", text: "Already named." };
    return { tone: "bad", text: "Not on this continent." };
  },
  payload(s, ctx) {
    return {
      gameSlug: "continent-sprint",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.found.length,
      scoreMax: s.allCountries.length,
      scoreSortValue: s.found.length,
      scoreDisplay: `${s.found.length} / ${s.allCountries.length}`,
      resultJson: { found: s.found.length, total: s.allCountries.length, continent: s.continent, elapsed: s.elapsed },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.found.length} / ${s.allCountries.length} named`,
  keepBoardOnResult: false,
  submits: true,
};
