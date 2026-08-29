import { mulberry32 } from "@/lib/seeded-random";
import { createBorderBuddies, giveUp, guessCountry, type BorderBuddiesState } from "@/lib/game-logic/border-buddies/engine";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export type BorderAction = { t: "found"; iso3: string } | { t: "giveup" };

export const gameModule: GameModule<BorderBuddiesState, BorderAction> = {
  slug: "border-buddies",
  create(seed) {
    return createBorderBuddies(mulberry32(seed));
  },
  reduce(s, a) {
    if (a.t === "found") return guessCountry(s, a.iso3);
    if (a.t === "giveup") return s.phase === "playing" ? giveUp(s) : s;
    return s;
  },
  codec,
  /** A wrong guess leaves the state unchanged and is not persisted; the give-up is. */
  persist: (a) => a.t === "giveup" || a.t === "found",
  done: (s) => s.phase === "results",
  progress(s) {
    return { done: s.found.length, total: s.borders.length, label: "found", value: `${s.found.length} of ${s.borders.length}` };
  },
  verdict(prev, next, a) {
    if (a.t !== "found") return null;
    if (next !== prev) return { tone: "good", text: "Found." };
    if (prev.found.includes(a.iso3)) return { tone: "neutral", text: "Already found." };
    return { tone: "bad", text: "Not a border." };
  },
  payload(s, ctx) {
    return {
      gameSlug: "border-buddies",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.found.length,
      scoreMax: s.borders.length,
      scoreSortValue: s.found.length,
      scoreDisplay: `${s.found.length} / ${s.borders.length}`,
      resultJson: { found: s.found, total: s.borders.length, country: s.country.iso3, borders: s.borders },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.found.length} / ${s.borders.length}`,
  keepBoardOnResult: true,
  submits: true,
};
