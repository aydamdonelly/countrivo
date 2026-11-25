/*
 * Capital Quiz adapter: the pure engine in src/lib/game-logic/capital-quiz plus the seed it
 * was dealt from, so the continent filter can re-deal the board without a server round trip.
 *
 * Practice only. The whole board is local, like Speed Flags: a finished run is sent with its
 * log and replayed on the server from the ticket's seed before it is saved.
 */
import { mulberry32 } from "@/lib/seeded-random";
import {
  ROUNDS,
  REGION_LABELS,
  canChooseRegion,
  createCapitalQuiz,
  hits,
  misses,
  next,
  pick,
  regionSeed,
  type CapitalQuizState,
  type CapitalRegion,
} from "@/lib/game-logic/capital-quiz/engine";
import { buildCapitalQuizShare } from "@/lib/share/capital-quiz";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface CapitalState {
  /** The seed of this run; each filter deals from it. */
  seed: number;
  g: CapitalQuizState;
}

export type CapitalAction = { t: "region"; r: CapitalRegion } | { t: "pick"; i: number } | { t: "next" };

export const CAPITAL_ROUNDS = ROUNDS;

function deal(seed: number, region: CapitalRegion): CapitalState {
  return { seed, g: createCapitalQuiz(mulberry32(regionSeed(seed, region)), region) };
}

/** `Europe` for a continent board, null for the whole world. */
export function scopeName(region: CapitalRegion): string | null {
  return region === "world" ? null : REGION_LABELS[region];
}

/** Picks on the board, the open reveal included. */
function answered(s: CapitalState): number {
  return s.g.answers.filter((a) => a !== null).length;
}

export const gameModule: GameModule<CapitalState, CapitalAction> = {
  slug: "capital-quiz",

  create(seed) {
    return deal(seed, "world");
  },

  reduce(s, a) {
    switch (a.t) {
      case "region":
        if (!canChooseRegion(s.g) || a.r === s.g.region) return s;
        return deal(s.seed, a.r);
      case "pick": {
        const g = pick(s.g, a.i);
        return g === s.g ? s : { ...s, g };
      }
      case "next": {
        const g = next(s.g);
        return g === s.g ? s : { ...s, g };
      }
      default:
        return s;
    }
  },

  codec,

  done: (s) => s.g.phase === "results",

  progress(s) {
    return {
      done: answered(s),
      total: s.g.questions.length,
      label: "score",
      value: String(s.g.score),
      extra: `of ${s.g.questions.length}`,
      misses: misses(s.g),
    };
  },

  // The options carry the reveal and the board prints the answer, so the line stays empty;
  // the tone still drives the juice.
  verdict(prev, nextState, a) {
    if (a.t !== "pick" || nextState.g.phase !== "reveal" || prev.g.phase !== "question") return null;
    return { tone: nextState.g.score > prev.g.score ? "good" : "bad", text: "" };
  },

  payload(s, ctx) {
    const { g } = s;
    return {
      gameSlug: "capital-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: g.score,
      scoreMax: g.questions.length,
      scoreSortValue: g.score,
      scoreDisplay: `${g.score} of ${g.questions.length}`,
      resultJson: {
        v: 1,
        region: g.region,
        score: g.score,
        total: g.questions.length,
        countries: g.questions.map((q) => q.iso3),
        capitals: g.questions.map((q) => q.options[q.correctIndex]),
        picked: g.questions.map((q, i) => {
          const a = g.answers[i];
          return a === null ? null : q.options[a];
        }),
        hits: hits(g),
      },
      startedAt: ctx.startedAt,
    };
  },

  scoreLabel: (s) => `${s.g.score} of ${s.g.questions.length}`,

  share: (s) => buildCapitalQuizShare({ score: s.g.score, total: s.g.questions.length, hits: hits(s.g), scope: scopeName(s.g.region) }),

  keys(s, dispatch): Record<string, () => void> {
    if (s.g.phase === "reveal") {
      const go = () => dispatch({ t: "next" });
      return { Enter: go, " ": go };
    }
    if (s.g.phase !== "question") return {};
    return Object.fromEntries(s.g.questions[s.g.current].options.map((_, i) => [String(i + 1), () => dispatch({ t: "pick", i })]));
  },

  keyHint: "1 to 4 pick · Enter next",
  keepBoardOnResult: false,
  submits: true,
};
