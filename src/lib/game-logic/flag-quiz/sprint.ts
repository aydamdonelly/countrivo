/*
 * Flag Quiz sprint (November 2026): twenty seconds, as many flags as you can name.
 * Pure: no React, no clock of its own, the RNG is injected. Every move carries the time the
 * SERVER received it (`at`, epoch ms); the reducer only compares those stamps, so a replay of
 * a stored log always lands on the same state.
 *
 *   The board    a fixed sequence of SPRINT_LENGTH sovereign flags. The first SPRINT_OPENERS
 *                are widely known (pools.ts KNOWN), the rest are drawn from every sovereign
 *                state. Each flag has four names: its lookalike family first (pools.ts
 *                LOOKALIKES, core and kin), topped up with the nearest states of its
 *                subregion, then region.
 *   The clock    `start` stamps the start. The deadline is start + 20 s, minus 2 s for every
 *                wrong answer. An answer stamped up to GRACE_MS after the deadline still
 *                counts (it was in flight when the clock ran out) and ends the run; a later
 *                one is not counted and ends the run. `finish` ends the run at any time.
 *   The score    the number of right answers. Higher is better; equal scores share a rank.
 *
 * The daily board is built from the HMAC daily seed, so everyone gets the same sequence.
 * Practice draws a fresh sequence and leaves out today's daily flags (`exclude`).
 */
import { countryOf, regionRanked, sovereignPool } from "./engine";
import { KNOWN, LOOKALIKES } from "./pools";

export const SPRINT_SECONDS = 20;
export const SPRINT_MS = SPRINT_SECONDS * 1000;
export const PENALTY_SECONDS = 2;
export const PENALTY_MS = PENALTY_SECONDS * 1000;
/** How late an in-flight answer may arrive and still count. */
export const GRACE_MS = 1500;
/** Flags in one sequence: more than anyone names in twenty seconds. */
export const SPRINT_LENGTH = 60;
/** Widely known flags at the start of every sequence. */
export const SPRINT_OPENERS = 6;
export const SPRINT_OPTIONS = 4;
/** The daily target shown on the result: a good run, not a player. */
export const SPRINT_TARGET = 8;
/** The first Berlin day whose daily board is the sprint; earlier days are frozen ten-flag quizzes. */
export const FLAG_SPRINT_FIRST_DAY = "2026-11-26";
/** resultJson version of a sprint run (the ten-flag quiz saved v2). */
export const SPRINT_RESULT_VERSION = 3;

export interface SprintFlag {
  /** The answer. */
  iso3: string;
  /** Four iso3 codes in seeded order, the answer among them. */
  options: readonly string[];
  correctIndex: number;
}

export interface SprintAnswer {
  /** The picked option. */
  i: number;
  /** Server receipt time, epoch ms. */
  at: number;
}

/**
 * Why a run ended. `time`: an answer used up the clock (no further flag was shown).
 * `finish`: the clock ran out with a flag on screen. `late`: an answer arrived after the
 * grace window, with that flag on screen. `all`: the sequence ran out.
 */
export type SprintEnd = "time" | "finish" | "late" | "all";

export interface SprintState {
  kind: "sprint";
  v: 1;
  flags: SprintFlag[];
  /** Server time of the start, null before the player starts. */
  startedAt: number | null;
  /** One entry per answered flag, in sequence order. */
  answers: SprintAnswer[];
  endedAt: number | null;
  end: SprintEnd | null;
}

export type SprintMove = { t: "start"; at: number } | { t: "answer"; i: number; at: number } | { t: "finish"; at: number };

// ── the board ────────────────────────────────────────────────────────────────

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Every lookalike family member of a state (core and kin of each family it belongs to). */
const FAMILY = new Map<string, string[]>();
for (const set of LOOKALIKES) {
  const members = [...set.core, ...set.kin];
  for (const iso3 of members) FAMILY.set(iso3, [...new Set([...(FAMILY.get(iso3) ?? []), ...members.filter((m) => m !== iso3)])]);
}

const NONE: ReadonlySet<string> = new Set();

const SOVEREIGN = new Set(sovereignPool());

function sprintFlag(answer: string, rng: () => number): SprintFlag {
  const kin = shuffled((FAMILY.get(answer) ?? []).filter((c) => SOVEREIGN.has(c)), rng);
  const distractors: string[] = [];
  for (const c of [...kin, ...regionRanked(answer, rng, NONE)]) {
    if (distractors.length === SPRINT_OPTIONS - 1) break;
    if (c !== answer && !distractors.includes(c)) distractors.push(c);
  }
  const options = shuffled([answer, ...distractors], rng);
  return { iso3: answer, options, correctIndex: options.indexOf(answer) };
}

/**
 * A sprint board. `exclude` keeps answers off the board (practice leaves out today's daily
 * flags); excluded states can still appear as wrong options.
 */
export function createSprint(rng: () => number, exclude: ReadonlySet<string> = NONE): SprintState {
  const pool = sovereignPool().filter((c) => !exclude.has(c));
  const inPool = new Set(pool);
  const openers = shuffled(KNOWN.filter((c) => inPool.has(c)), rng).slice(0, SPRINT_OPENERS);
  const rest = shuffled(pool.filter((c) => !openers.includes(c)), rng).slice(0, SPRINT_LENGTH - openers.length);
  const flags = [...openers, ...rest].map((answer) => sprintFlag(answer, rng));
  return { kind: "sprint", v: 1, flags, startedAt: null, answers: [], endedAt: null, end: null };
}

/** True for a stored sprint state (the ten-flag quiz snapshot has a `g` instead). */
export function isSprintState(value: unknown): value is SprintState {
  return !!value && typeof value === "object" && "kind" in value && value.kind === "sprint" && "flags" in value && Array.isArray(value.flags);
}

// ── the clock ────────────────────────────────────────────────────────────────

export function wrongCount(s: SprintState): number {
  let n = 0;
  s.answers.forEach((a, i) => { if (a.i !== s.flags[i]?.correctIndex) n++; });
  return n;
}

export function correctCount(s: SprintState): number {
  return s.answers.length - wrongCount(s);
}

/** Right or wrong per answered flag. */
export function sprintHits(s: SprintState): boolean[] {
  return s.answers.map((a, i) => a.i === s.flags[i]?.correctIndex);
}

/** The server time the clock runs out, penalties included; null before the start. */
export function deadlineOf(s: SprintState): number | null {
  return s.startedAt === null ? null : s.startedAt + SPRINT_MS - PENALTY_MS * wrongCount(s);
}

/** Milliseconds left at server time `now` (0 once the clock has run out). */
export function remainingMs(s: SprintState, now: number): number {
  const deadline = deadlineOf(s);
  if (deadline === null) return SPRINT_MS;
  if (s.end !== null) return 0;
  return Math.max(0, deadline - now);
}

export function sprintDone(s: SprintState): boolean {
  return s.end !== null;
}

/** The flag on screen: the first unanswered one while the clock runs, else null. */
export function currentFlag(s: SprintState): SprintFlag | null {
  if (s.startedAt === null || s.end !== null) return null;
  return s.flags[s.answers.length] ?? null;
}

function lastStamp(s: SprintState): number {
  return s.answers.length ? s.answers[s.answers.length - 1].at : (s.startedAt ?? 0);
}

/** The pure reducer. A move that changes nothing returns the same state object. */
export function reduceSprint(s: SprintState, m: SprintMove): SprintState {
  if (s.end !== null || !Number.isFinite(m.at)) return s;
  if (m.t === "start") return s.startedAt === null ? { ...s, startedAt: m.at } : s;
  if (s.startedAt === null) return s;
  // Stamps from different server instances can disagree by a few ms; time never runs back.
  const at = Math.max(m.at, lastStamp(s));
  if (m.t === "finish") return { ...s, endedAt: at, end: "finish" };
  const flag = s.flags[s.answers.length];
  if (!flag || !Number.isInteger(m.i) || m.i < 0 || m.i >= flag.options.length) return s;
  const deadline = s.startedAt + SPRINT_MS - PENALTY_MS * wrongCount(s);
  if (at > deadline + GRACE_MS) return { ...s, endedAt: at, end: "late" };
  const next: SprintState = { ...s, answers: [...s.answers, { i: m.i, at }] };
  const nextDeadline = deadline - (m.i === flag.correctIndex ? 0 : PENALTY_MS);
  if (at > deadline || at >= nextDeadline) return { ...next, endedAt: at, end: "time" };
  if (next.answers.length >= s.flags.length) return { ...next, endedAt: at, end: "all" };
  return next;
}

/** `11 flags`, `1 flag`. */
export function flagsLabel(n: number): string {
  return `${n} ${n === 1 ? "flag" : "flags"}`;
}

/** The flag that was on screen when the run ended unanswered, if any. */
export function flagLeftOnScreen(s: SprintState): SprintFlag | null {
  return s.end === "finish" || s.end === "late" ? (s.flags[s.answers.length] ?? null) : null;
}

/** The display name of an iso3 on a sprint board. */
export function sprintName(iso3: string): string {
  return countryOf(iso3).displayName;
}
