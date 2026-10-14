/*
 * Speed Flags (concept 5.8): thirty seconds of two-name flags.
 *
 * - The round runs on the wall clock (`endsAt`), never a counter, so a backgrounded tab
 *   cannot pause it. Every time-bearing action carries its own `now`; the engine never
 *   reads the clock itself.
 * - Each flag has two names. The distractor comes from an authored lookalike set when the
 *   answer has one (half the time) and otherwise from the answer's own subregion, so a
 *   flag is never answered by elimination on the continent alone.
 * - The score is the number right. A wrong answer costs three seconds and moves on: without
 *   the penalty, random fast tapping (about 40 right) beats real knowledge (about 30).
 * - After an answer the pair holds for a short reveal, then the next flag is dealt and
 *   ignores input for a short lock. Both windows are timed by the host; the engine only
 *   records that they are open.
 *
 * Sovereign states only: the distractor is always the same kind of thing as the answer.
 */
import { countries } from "@/lib/data/public";
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import sovereign from "@/data/sovereign.json";
import type { Country } from "@/types/country";

/** The round length. */
export const DURATION_MS = 30_000;
/** What a wrong answer takes off the clock. */
export const PENALTY_MS = 3_000;
/** How long the chosen row holds its ink or ember fill before the next flag. */
export const REVEAL_MS = 300;
/** How long a newly dealt flag ignores input. */
export const LOCK_MS = 150;
/** How long the penalty mark stands beside the seconds. */
export const PENALTY_SHOW_MS = 600;
/**
 * Flags dealt per round. A flag cannot be answered faster than LOCK_MS + REVEAL_MS, so a
 * round holds at most MAX_ANSWERS answers; the queue is longer than that and never runs dry.
 */
export const QUEUE_SIZE = 80;
/** The most answers a round can physically hold: answers land at 150, 600, 1050 ... < 30000 ms. */
export const MAX_ANSWERS = Math.floor((DURATION_MS - LOCK_MS - 1) / (LOCK_MS + REVEAL_MS)) + 1;
/** A round ends at the latest on the tenth wrong answer (ten penalties empty the clock). */
export const MAX_WRONG = Math.ceil(DURATION_MS / PENALTY_MS);

/**
 * Authored lookalike sets: flags people genuinely confuse (same colours, same layout).
 * A country may sit in more than one set; its partners are the union.
 */
export const LOOKALIKE_SETS: readonly (readonly string[])[] = [
  ["TCD", "ROU", "AND", "MDA"],
  ["IDN", "MCO", "POL"],
  ["IRL", "CIV"],
  ["ITA", "MEX", "IRL"],
  ["SVN", "SVK", "RUS", "SRB"],
  ["AUS", "NZL"],
  ["NOR", "ISL", "FIN", "SWE", "DNK"],
  ["SEN", "MLI", "GIN", "CMR"],
  ["NLD", "LUX"],
  ["COL", "ECU", "VEN"],
  ["HND", "NIC", "SLV"],
  ["QAT", "BHR"],
  ["JOR", "PSE", "SDN", "KWT", "ARE"],
  ["EGY", "YEM", "SYR", "IRQ"],
  ["HTI", "LIE"],
  ["NER", "IND"],
  ["BEL", "DEU"],
  ["USA", "LBR", "MYS"],
  ["AUT", "LVA"],
  ["GHA", "BOL", "ETH", "LTU"],
  ["KEN", "SSD"],
  ["CUB", "URY", "GRC"],
  ["BGD", "JPN", "PLW"],
  ["TUR", "TUN"],
  ["SLE", "GAB"],
  ["MAR", "VNM"],
];

const SOVEREIGN = new Set<string>(sovereign);
/** The pool: every sovereign state, in data order. */
export const POOL: readonly Country[] = countries.filter((c) => SOVEREIGN.has(c.iso3));
const BY_ISO3 = new Map(POOL.map((c) => [c.iso3, c]));

function partnersOf(iso3: string): Country[] {
  const out = new Set<string>();
  for (const set of LOOKALIKE_SETS) {
    if (!set.includes(iso3)) continue;
    for (const p of set) if (p !== iso3) out.add(p);
  }
  return [...out].map((p) => BY_ISO3.get(p)).filter((c): c is Country => c !== undefined);
}

/** Where a distractor came from; the contract test asserts it. */
export type DistractorSource = "lookalike" | "subregion" | "region";

export interface SpeedFlagsQuestion {
  country: Country;
  options: [Country, Country];
  correctIdx: 0 | 1;
  source: DistractorSource;
}

export type Pick = 0 | 1;

export interface SpeedFlagsReveal {
  chosen: Pick;
  right: boolean;
}

export interface SpeedFlagsState {
  queue: SpeedFlagsQuestion[];
  /** The flag on screen. */
  currentIdx: number;
  correct: number;
  wrong: number;
  /** Answers given (correct + wrong). */
  total: number;
  /** Whole seconds left, rounded up; what the header prints. */
  timeLeft: number;
  /** Absolute wall-clock ms when the round ends; null until it starts. Penalties pull it in. */
  endsAt: number | null;
  phase: "ready" | "playing" | "results";
  /** The answer being shown (REVEAL_MS), or null. */
  reveal: SpeedFlagsReveal | null;
  /** A newly dealt flag ignores input until the host lifts this (LOCK_MS). */
  locked: boolean;
  /** Absolute ms until which "-3 s" stands beside the seconds; null when it is not shown. */
  penaltyUntil: number | null;
}

/** One distractor for `answer`: a lookalike half the time when it has one, else its subregion. */
function distractorFor(answer: Country, rng: () => number): { c: Country; source: DistractorSource } {
  const partners = partnersOf(answer.iso3);
  const coin = rng();
  if (partners.length > 0 && coin < 0.5) {
    return { c: seededPick(partners, 1, rng)[0], source: "lookalike" };
  }
  const sub = POOL.filter((c) => c.subregion === answer.subregion && c.iso3 !== answer.iso3);
  if (sub.length > 0) return { c: seededPick(sub, 1, rng)[0], source: "subregion" };
  const region = POOL.filter((c) => c.region === answer.region && c.iso3 !== answer.iso3);
  return { c: seededPick(region, 1, rng)[0], source: "region" };
}

export function createSpeedFlags(rng: () => number, queueSize = QUEUE_SIZE): SpeedFlagsState {
  const answers = seededShuffle([...POOL], rng).slice(0, Math.min(queueSize, POOL.length));
  const queue: SpeedFlagsQuestion[] = answers.map((country) => {
    const { c: distractor, source } = distractorFor(country, rng);
    const correctIdx: Pick = rng() < 0.5 ? 0 : 1;
    const options: [Country, Country] = correctIdx === 0 ? [country, distractor] : [distractor, country];
    return { country, options, correctIdx, source };
  });

  return {
    queue,
    currentIdx: 0,
    correct: 0,
    wrong: 0,
    total: 0,
    timeLeft: DURATION_MS / 1000,
    endsAt: null,
    phase: "ready",
    reveal: null,
    locked: false,
    penaltyUntil: null,
  };
}

function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function timeUp(state: SpeedFlagsState): SpeedFlagsState {
  return { ...state, timeLeft: 0, phase: "results", reveal: null, locked: false, penaltyUntil: null };
}

/** The clock starts and the first flag is dealt, locked like every new flag. */
export function startGame(state: SpeedFlagsState, now: number): SpeedFlagsState {
  if (state.phase !== "ready") return state;
  return { ...state, phase: "playing", endsAt: now + DURATION_MS, timeLeft: DURATION_MS / 1000, locked: true };
}

/** Whether an answer would be taken right now. */
export function accepting(state: SpeedFlagsState): boolean {
  return state.phase === "playing" && state.reveal === null && !state.locked && state.currentIdx < state.queue.length;
}

/**
 * Commit an answer. A wrong one pulls the end of the round in by PENALTY_MS; if that
 * empties the clock the round ends on the spot.
 */
export function answer(state: SpeedFlagsState, chosen: number, now: number): SpeedFlagsState {
  if (!accepting(state) || state.endsAt === null) return state;
  if (chosen !== 0 && chosen !== 1) return state;
  if (now >= state.endsAt) return timeUp(state);

  const right = chosen === state.queue[state.currentIdx].correctIdx;
  const endsAt = right ? state.endsAt : state.endsAt - PENALTY_MS;
  const next: SpeedFlagsState = {
    ...state,
    correct: state.correct + (right ? 1 : 0),
    wrong: state.wrong + (right ? 0 : 1),
    total: state.total + 1,
    endsAt,
    timeLeft: secondsLeft(endsAt, now),
    reveal: { chosen, right },
    penaltyUntil: right ? state.penaltyUntil : now + PENALTY_SHOW_MS,
  };
  return endsAt <= now ? timeUp(next) : next;
}

/** The reveal is over: deal the next flag, locked. */
export function nextFlag(state: SpeedFlagsState): SpeedFlagsState {
  if (state.phase !== "playing" || state.reveal === null) return state;
  const currentIdx = state.currentIdx + 1;
  if (currentIdx >= state.queue.length) return { ...timeUp(state), currentIdx: state.queue.length - 1 };
  return { ...state, currentIdx, reveal: null, locked: true };
}

/** The new flag has been on screen for LOCK_MS. */
export function unlock(state: SpeedFlagsState): SpeedFlagsState {
  return state.locked ? { ...state, locked: false } : state;
}

/**
 * Ask the engine what time it is. Returns the SAME object when nothing visible changed, so
 * a fast tick costs no render. While a reveal or a lock is open only the end of the round is
 * applied: the host times those windows from the state, and a new state object would re-arm
 * them.
 */
export function tick(state: SpeedFlagsState, now: number): SpeedFlagsState {
  if (state.phase !== "playing" || state.endsAt === null) return state;
  if (now >= state.endsAt) return timeUp(state);
  if (state.reveal !== null || state.locked) return state;
  const timeLeft = secondsLeft(state.endsAt, now);
  const penaltyUntil = state.penaltyUntil !== null && now >= state.penaltyUntil ? null : state.penaltyUntil;
  if (timeLeft === state.timeLeft && penaltyUntil === state.penaltyUntil) return state;
  return { ...state, timeLeft, penaltyUntil };
}
