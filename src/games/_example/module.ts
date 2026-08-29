/*
 * The reference module (blueprint 14 P3): the smallest game that exercises every part of the
 * contract in src/games/types.ts, so a board author can read one file and see the whole shape.
 * It is not in the registry and has no route; P8 deletes the folder before release.
 *
 * What it proves, in order: a deterministic `create` from a seed, a pure `reduce`, a codec
 * that round-trips the log, a feedback window the host holds `busy` for, a timed follow-up
 * (`after`), the progress line, verdicts with juice tones, the submit payload, the compact
 * score, a key map, and the two flags the host branches on.
 */
import { mulberry32 } from "@/lib/seeded-random";
import { getAllCountries } from "@/lib/data/countries";
import type { Country } from "@/types/country";
import type { GameModule } from "@/games/types";
import { codec } from "./codec";

export interface ExampleRound {
  country: Country;
  options: Country[];
  correctIndex: number;
}

export interface ExampleState {
  rounds: ExampleRound[];
  current: number;
  /** The pick that is showing its answer; the round commits on `advance`. */
  pending: number | null;
  answers: (number | null)[];
  score: number;
  finished: boolean;
}

export type ExampleAction = { t: "answer"; i: number } | { t: "advance"; ui: true };

export const EXAMPLE_ROUNDS = 3;
export const EXAMPLE_OPTIONS = 4;
/** How long the answer stays on screen before the next round (blueprint 8.5). */
const FEEDBACK_MS = 900;

const ADVANCE: ExampleAction = { t: "advance", ui: true };

/** Pure: the same seed always deals the same three rounds, on the server and on the client. */
function deal(seed: number): ExampleRound[] {
  const rng = mulberry32(seed);
  const all = getAllCountries();
  const rounds: ExampleRound[] = [];
  for (let r = 0; r < EXAMPLE_ROUNDS; r += 1) {
    const options: Country[] = [];
    while (options.length < EXAMPLE_OPTIONS) {
      const pick = all[Math.floor(rng() * all.length)];
      if (!options.some((c) => c.iso3 === pick.iso3) && !rounds.some((x) => x.country.iso3 === pick.iso3)) options.push(pick);
    }
    const correctIndex = Math.floor(rng() * EXAMPLE_OPTIONS);
    rounds.push({ country: options[correctIndex], options, correctIndex });
  }
  return rounds;
}

function commit(s: ExampleState): ExampleState {
  if (s.pending === null) return s;
  const answers = [...s.answers];
  answers[s.current] = s.pending;
  const right = s.pending === s.rounds[s.current].correctIndex;
  const last = s.current === s.rounds.length - 1;
  return { ...s, answers, score: s.score + (right ? 1 : 0), pending: null, current: last ? s.current : s.current + 1, finished: last };
}

export const gameModule: GameModule<ExampleState, ExampleAction> = {
  // The registry has no `_example` slug; the reference module borrows the flag quiz's, so the
  // contract type-checks without loosening PlayableSlug.
  slug: "flag-quiz",
  create(seed) {
    return { rounds: deal(seed), current: 0, pending: null, answers: Array(EXAMPLE_ROUNDS).fill(null), score: 0, finished: false };
  },
  reduce(s, a) {
    if (a.t === "advance") return commit(s);
    if (a.t === "answer") {
      if (s.finished || s.pending !== null || a.i < 0 || a.i >= EXAMPLE_OPTIONS) return s;
      return { ...s, pending: a.i };
    }
    return s;
  },
  codec,
  feedback: { ms: FEEDBACK_MS, inWindow: (s) => s.pending !== null, advance: ADVANCE },
  done: (s) => s.finished,
  progress(s) {
    return {
      done: s.answers.filter((x) => x !== null).length,
      total: EXAMPLE_ROUNDS,
      label: "round",
      value: `${Math.min(s.current + 1, EXAMPLE_ROUNDS)} of ${EXAMPLE_ROUNDS}`,
      extra: `right ${s.score}`,
      misses: s.answers.map((x, i) => (x !== null && x !== s.rounds[i].correctIndex ? i : -1)).filter((i) => i >= 0),
    };
  },
  verdict(prev, next, a) {
    if (a.t !== "answer" || next.pending === null) return null;
    const round = next.rounds[next.current];
    return next.pending === round.correctIndex ? { tone: "good", text: "Right." } : { tone: "bad", text: `Wrong. It was ${round.country.displayName}.` };
  },
  payload(s, ctx) {
    return {
      gameSlug: "flag-quiz",
      mode: ctx.mode,
      dateKey: ctx.dateKey,
      scoreRaw: s.score,
      scoreMax: EXAMPLE_ROUNDS,
      scoreSortValue: s.score,
      scoreDisplay: `${s.score} / ${EXAMPLE_ROUNDS}`,
      resultJson: { score: s.score, total: EXAMPLE_ROUNDS, answers: s.answers },
      startedAt: ctx.startedAt,
    };
  },
  scoreLabel: (s) => `${s.score} / ${EXAMPLE_ROUNDS}`,
  keys(s, dispatch): Record<string, () => void> {
    if (s.pending !== null || s.finished) return {};
    const map: Record<string, () => void> = {};
    for (let i = 0; i < EXAMPLE_OPTIONS; i += 1) map[String(i + 1)] = () => dispatch({ t: "answer", i });
    return map;
  },
  keyHint: "1 to 4 pick",
  keepBoardOnResult: false,
  submits: true,
};
