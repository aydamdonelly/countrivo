/*
 * The frozen game contract (blueprint 8.2). A game is a server-safe adapter (`module.ts`,
 * no React) plus a client board; the generic host (src/features/play/game-host.tsx) owns
 * the reducer loop, the resume log, submission, the auth hand-off and the result surface.
 * Types are published by P3 and frozen afterwards; later changes are additive only.
 */
import type { ComponentType } from "react";
import type { RunDetail, ServerGameRun } from "@/types/server";
import type { GameSlug, Mode, Viewer } from "@/ui/types";
import type { submitGameRun } from "@/app/actions/game-runs";

/** The 17 slugs with a play route (World Draft has none). */
export type PlayableSlug = Exclude<GameSlug, "world-draft">;

/**
 * Every action carries a tag `t`. `ui: true` marks an action that is never persisted and
 * never juiced (a selection cursor, a cleared selection, a clock tick). Tick actions use
 * the tag "tick" and are never persisted either. Actions are small and serialisable:
 * indices, iso3 strings, numbers.
 */
export interface Action {
  t: string;
  ui?: boolean;
}

/** The exact input of the kept submitGameRun action (understand.json data). */
export type SubmitGameRunInput = Parameters<typeof submitGameRun>[0];

/**
 * The resume log codec (blueprint 8.3). `enc` encodes the WHOLE persisted action list at
 * once, so a module may fold it (Cluster rewrites the selection as one `S` token,
 * Population Sort keeps only the last order); `dec` expands a log back into the actions the
 * reducer understands. Round trip rule: replaying dec(enc(log)) yields the same state as
 * replaying log. `dec` throws on a malformed log; the page then discards the cookie.
 */
export interface Codec<A extends Action> {
  enc(log: readonly A[]): string;
  dec(s: string): A[];
}

export interface ProgressInfo {
  /** Completed units (picks, answers, groups). Drives the pips or the bar. */
  done: number;
  /** Omit for open-ended games (a streak): the left side shows nothing. */
  total?: number;
  /** The mute label before the Erode value: `score`, `streak`, `found`. */
  label: string;
  /** The Erode value: `412`, `7`, `3 of 9`. */
  value: string;
  /** A mute tail: `4 picks left`, `0:42`, `best 22`. */
  extra?: string;
  /** Force the 3 px bar instead of pips (a total above 20 forces it anyway). */
  bar?: boolean;
  /** Pip indices drawn as a mistake (an ember outline). */
  misses?: readonly number[];
  /** The pip drawn as current; defaults to the first undone one, null for none. */
  current?: number | null;
  /** The streak games: a burning flame before the label. */
  flame?: boolean;
  /** A real-time bar (Speed Flags): the fill moves linearly, one second per tick. */
  timer?: boolean;
  /** The value burns and beats on every change (Speed Flags under 5 s, blueprint 6.3.9). */
  hot?: boolean;
}

export interface VerdictInfo {
  tone: "good" | "neutral" | "bad";
  /** `Rank 4. Great pick.` */
  text: string;
  /** `+118`, mute, appended. */
  delta?: string;
  /** Every fifth correct in the streak games: juice.milestone instead of juice.correct. */
  milestone?: boolean;
}

/** A timed follow-up the host schedules: the feedback window, an AI move, the 60 s auto-seen. */
export interface TimedAction<A extends Action> {
  ms: number;
  then: A;
  /** Hold `busy` (pointer events off on the options) while waiting. Default true. */
  busy?: boolean;
}

export interface PayloadContext {
  mode: Mode;
  dateKey: string;
  /** ISO, from the cookie or the request time. */
  startedAt: string;
}

export interface ShareContext {
  mode: Mode;
  dateKey: string;
  title: string;
  /** The daily rank from the saved run, when known. */
  rank: number | null;
}

export interface GameModule<S, A extends Action> {
  slug: PlayableSlug;
  /** Pure. Same seed, same state on server and client. No Date.now(), no Math.random(). */
  create(seed: number, mode: Mode, dateKey: string): S;
  /** Pure reducer over engine functions. Unknown actions return state unchanged. */
  reduce(state: S, action: A): S;
  /** The resume log codec (blueprint 8.3). */
  codec: Codec<A>;
  /** Which actions are persisted. Default: every action without `ui: true` whose tag is not "tick". */
  persist?(action: A): boolean;
  done(state: S): boolean;
  progress(state: S): ProgressInfo;
  /** The verdict for an action, or null to leave the line unchanged. Evaluated even when the state did not change. */
  verdict(prev: S, next: S, action: A): VerdictInfo | null;
  /**
   * The feedback window (blueprint 8.5): while `inWindow(state)` the host holds `busy` for
   * `ms` and then dispatches `advance`. Replay applies `advance` right after every action
   * that opens a window, so a resumed log lands on a settled board.
   */
  feedback?: { ms: number; inWindow(state: S): boolean; advance: A };
  /** Any other timed follow-up for the current state (Supremacy's AI turn, the Draft's 60 s auto-seen). Re-evaluated on every state change. */
  after?(state: S): TimedAction<A> | null;
  /** The submitGameRun payload (exact shapes from understand.json engines.games[*].submission). */
  payload(state: S, ctx: PayloadContext): SubmitGameRunInput;
  /** The compact score for the result card and the done cookie: `612`, `4/6`, `1 280 pts`, `7 in a row`. */
  scoreLabel(state: S): string;
  /** The clipboard share text; the host falls back to buildShareGrid. Never rendered on screen. */
  share?(state: S, ctx: ShareContext): string;
  /** The key map while the board is live and not busy. Keys on editable targets are never intercepted. */
  keys?(state: S, dispatch: (a: A) => void): Record<string, () => void>;
  /** `1 to 8 pick · Enter next`, shown on fine pointers only. */
  keyHint?: string;
  /** Country Draft, Cluster, GeoWordle, Population Sort, Border Buddies, Borderline keep the finished board above the panel. */
  keepBoardOnResult: boolean;
  /** false for blitz, borderline, supremacy: submitGameRun is never called. */
  submits: boolean;
}

/** What a board knows about the viewer (the full Viewer never crosses to the client). */
export type PlayViewer = Pick<Viewer, "signedIn" | "name" | "crest" | "streak">;

export interface BoardProps<S, A extends Action> {
  state: S;
  /** The host wraps it: records, persists, juices by verdict tone. */
  dispatch: (a: A) => void;
  mode: Mode;
  /** True during a feedback window or a timed follow-up. */
  busy: boolean;
  viewer: PlayViewer;
  /** For boards that render a hint derived from the seed (none today). */
  seed: number;
}

export interface ResultProps<S> {
  state: S;
  mode: Mode;
  /** The saved run, once submitGameRun settled. */
  run: ServerGameRun | null;
}

/** The rows for /games/{slug}/run/{runId}; a server component. */
export interface RunDetailProps {
  run: RunDetail;
}

/** A row of NextDailies: registry order, Country Draft first. */
export interface DailyRef {
  slug: GameSlug;
  title: string;
}

export interface HostProps {
  slug: PlayableSlug;
  title: string;
  mode: Mode;
  dateKey: string;
  edition: string;
  seed: number;
  /** The encoded resume log ("" when fresh). */
  log: string;
  /** ISO, from the cookie or the request time. */
  startedAt: string;
  viewer: PlayViewer;
  resetAt: number;
  serverNow: number;
  /** Friends who shot this game today (null for guests). */
  friendsToday: number | null;
  friendCount: number;
  /** Their score_sort_value today, for `#2 of 5 friends`. */
  friendScores: number[];
  /** profiles.streak_current before this shot, for the streak beat. */
  streakBefore: number;
  /** The day's shot count for this game (null when unknown: guests). */
  shots: number | null;
  /** The signed-in viewer's practice best, formatted (`790`, `4/6`), for the practice panel. */
  practiceBest: string | null;
  /** The dailies in registry order, for NextDailies. */
  dailies: DailyRef[];
  /** Slugs the viewer already shot today. */
  shotToday: string[];
}

export type HostComponent = ComponentType<HostProps>;

export type BoardComponent<S, A extends Action> = ComponentType<BoardProps<S, A>>;
export type ResultComponent<S> = ComponentType<ResultProps<S>>;
export type RunDetailComponent = ComponentType<RunDetailProps>;

/**
 * The export names a game folder publishes, so the registry and the host can find them:
 * `module.ts` exports `gameModule` (never `module`: the name is reserved by the Next lint
 * rule), `codec.ts` exports `codec`, `board.tsx` exports `Board`, `result.tsx` exports
 * `Result`, `run-detail.tsx` exports `RunDetail`, `host.tsx` exports `{Game}Host`.
 */

/** The persistence rule every module gets unless it overrides `persist`. */
export function persistsByDefault(action: Action): boolean {
  return !action.ui && action.t !== "tick";
}
