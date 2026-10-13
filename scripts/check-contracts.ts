/*
 * The game-contract gate (blueprint 13, item 28).
 *
 * For every game in the roster: build the daily board from the fixed seed, play it to
 * completion through `module.create` / `module.reduce` alone, and assert
 *   1. the board is deterministic (same seed, same board, twice),
 *   2. `done()` turns true exactly once the game is over,
 *   3. the persisted action log round-trips through the codec and replays to the same
 *      state (same payload, same score label),
 *   4. `payload()` matches the submission shape this slug is stored under,
 *   5. the payload passes the structural validator that gates `submitGameRun`,
 *   6. the three daily replay validators accept an honest run and reject a lifted score.
 *
 * `validateGameResult` lives inside a "use server" file, so it cannot be exported and
 * cannot be imported here. VALIDATORS below mirrors it line for line, and `checkMirror`
 * reads the real file and fails if the two ever describe a different set of slugs. If you
 * add a game, add its case in both places.
 *
 * Run: npx tsx scripts/check-contracts.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { dateSeed } from "../src/lib/daily-seed";
import { blindPickShapeError, validateBlindPickResult } from "../src/lib/game-logic/blind-pick/server-validate";
import { validateCountryDraftResult } from "../src/lib/game-logic/country-draft/server-validate";
import { checkStatGuesserShape, validateStatGuesserResult } from "../src/lib/game-logic/stat-guesser/server-validate";
import { validateHigherOrLowerResult } from "../src/lib/game-logic/higher-or-lower/server-validate";
import { validateFlagQuizResult } from "../src/lib/game-logic/flag-quiz/server-validate";
import { LADDER, answerAt, farEnough } from "../src/lib/game-logic/higher-or-lower/engine";
import { rulerFor } from "../src/lib/game-logic/stat-guesser/engine";
import type { Action, GameModule, PayloadContext, SubmitGameRunInput } from "../src/games/types";
import type { GameSlug } from "../src/ui/types";

import { gameModule as countryDraft } from "../src/games/country-draft/module";
import { gameModule as blindPick, type BlindPickState } from "../src/games/blind-pick/module";
import { gameModule as higherOrLower, currentAnswer, type HoLState } from "../src/games/higher-or-lower/module";
import { gameModule as geoWordle } from "../src/games/geo-wordle/module";
import { gameModule as statGuesser } from "../src/games/stat-guesser/module";
import { gameModule as flagQuiz, type QuizState } from "../src/games/flag-quiz/module";
import { gameModule as pinpoint } from "../src/games/pinpoint/module";
import type { PinpointState } from "../src/lib/game-logic/pinpoint/engine";
import { gameModule as speedFlags } from "../src/games/speed-flags/module";

import type { DraftState } from "../src/lib/game-logic/country-draft/types";
import { guessableCountries, type GeoWordleState } from "../src/lib/game-logic/geo-wordle/engine";
import type { StatGuesserState } from "../src/lib/game-logic/stat-guesser/engine";
import type { SpeedFlagsState } from "../src/lib/game-logic/speed-flags/engine";

// --- harness ------------------------------------------------------------------

let failures = 0;
let checks = 0;
let current = "";

function check(ok: boolean, what: string): void {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${current}: ${what}`);
  }
}

/** Sets and Maps live in some engine states; JSON.stringify drops them without this. */
function replacer(_k: string, v: unknown): unknown {
  if (v instanceof Set) return { set: [...v] };
  if (v instanceof Map) return { map: [...v] };
  return v;
}

function eq<T>(a: T, b: T, what: string): void {
  const sa = JSON.stringify(a, replacer);
  const sb = JSON.stringify(b, replacer);
  check(sa === sb, sa === sb ? what : `${what} (got ${sa}, want ${sb})`);
}

/** The fixed day and edition every assertion runs against, so a failure is reproducible. */
const DATE_KEY = "2026-09-15";
const EDITION = "";
const SEED = dateSeed(DATE_KEY + EDITION);
const CTX: PayloadContext = { mode: "daily", dateKey: DATE_KEY, startedAt: "2026-09-15T09:00:00.000Z" };

const PAYLOAD_KEYS = [
  "dateKey",
  "gameSlug",
  "mode",
  "resultJson",
  "scoreDisplay",
  "scoreMax",
  "scoreRaw",
  "scoreSortValue",
  "startedAt",
];

/** The glyphs section 12 bans from rendered strings, plus the em dash. */
const BANNED = /[—→←✓✗✕↑↓↩★•]/u;

// --- the mirror of validateGameResult (src/app/actions/game-runs.ts) -----------

type ResultJson = Record<string, unknown>;
type Validator = (scoreRaw: number, scoreMax: number, r: ResultJson) => string | null;

const VALIDATORS: Record<string, Validator> = {
  "flag-quiz": (scoreRaw, scoreMax, r) => {
    const answers = r.answers;
    const hits = r.hits;
    if (!Array.isArray(answers) || answers.length !== 10) return "invalid_result";
    if (!Array.isArray(hits) || hits.length !== 10 || hits.some((h) => typeof h !== "boolean")) return "invalid_result";
    if (typeof r.score !== "number" || r.score !== scoreRaw) return "score_mismatch";
    const points = hits.reduce((sum: number, ok: unknown, i: number) => sum + (ok === true ? (i >= 7 ? 2 : 1) : 0), 0);
    if (points !== scoreRaw) return "score_mismatch";
    if (scoreMax !== 13 || scoreRaw > 13) return "score_exceeds_total";
    return null;
  },
  "higher-or-lower": (scoreRaw, scoreMax, r) => {
    if (typeof r.points === "number") {
      const hits = r.hits;
      if (!Array.isArray(hits) || hits.length !== 10) return "invalid_result";
      const points = hits.reduce<number>((sum, h, i) => sum + (h === true ? (i < 7 ? 1 : 2) : 0), 0);
      if (r.points !== scoreRaw || points !== scoreRaw) return "score_mismatch";
      if (scoreMax !== 13 || scoreRaw < 0 || scoreRaw > 13) return "score_exceeds_total";
      return null;
    }
    if (typeof r.streak !== "number") return "invalid_result";
    if (r.streak !== scoreRaw) return "score_mismatch";
    return null;
  },
  "speed-flags": (scoreRaw, _max, r) => {
    const { correct, wrong, total } = r;
    if (typeof correct !== "number" || typeof wrong !== "number" || typeof total !== "number") return "invalid_result";
    if (!Number.isInteger(correct) || !Number.isInteger(wrong) || correct < 0 || wrong < 0) return "invalid_result";
    if (correct !== scoreRaw) return "score_mismatch";
    if (correct + wrong !== total) return "score_mismatch";
    if (total > 67 || wrong > 10) return "score_exceeds_total";
    return null;
  },
  "stat-guesser": (scoreRaw, max, r) => checkStatGuesserShape(scoreRaw, max, r),
  "blind-pick": (scoreRaw, max, r) => blindPickShapeError(scoreRaw, max, r),
  "geo-wordle": (scoreRaw, scoreMax, r) => {
    const guesses = r.guesses;
    if (!Array.isArray(guesses)) return "invalid_result";
    if (typeof r.won !== "boolean") return "invalid_result";
    if (typeof r.answerIso3 !== "string") return "invalid_result";
    if (guesses.length < 1 || guesses.length > 6) return "invalid_result";
    if (r.won) {
      if (scoreRaw !== guesses.length) return "score_mismatch";
      const last = guesses[guesses.length - 1] as { correct?: boolean };
      if (!last || last.correct !== true) return "score_mismatch";
    } else {
      if (scoreRaw !== 6) return "score_mismatch";
      if (guesses.length !== 6) return "score_mismatch";
    }
    if (scoreRaw > scoreMax) return "score_exceeds_total";
    return null;
  },
  "pinpoint": (raw, max, r) => {
    if(!Number.isInteger(raw) || raw < 0 || raw > 1200 || max !== 1200) return "invalid_score";
    if(!Array.isArray(r.rounds) || r.rounds.length !== 5) return "invalid_result";
    if(r.score !== raw) return "score_mismatch";
    let total=0;
    for(const round of r.rounds) {
      if(!round || typeof round !== "object" || !("points" in round) || typeof round.points !== "number" || !("lat" in round) || typeof round.lat !== "number" || !("lng" in round) || typeof round.lng !== "number")return "invalid_result";
      if(round.lat < -65 || round.lat > 85 || round.lng < -180 || round.lng > 180) return "invalid_result";
      total+=round.points;
    }
    return total === raw ? null : "score_mismatch";
  },
  "country-draft": (scoreRaw, scoreMax, r) => {
    if (typeof r.score !== "number") return "invalid_result";
    if (r.score !== scoreRaw) return "score_mismatch";
    if (scoreRaw < 0 || scoreRaw > scoreMax) return "score_exceeds_total";
    const appointments = r.appointments;
    if (!Array.isArray(appointments) || appointments.length !== 5) return "invalid_result";
    const parts = [r.fitTotal, r.standingTotal, r.bonusTotal];
    if (parts.some((n) => typeof n !== "number")) return "invalid_result";
    if ((parts as number[]).reduce((a, b) => a + b, 0) !== scoreRaw) return "score_mismatch";
    return null;
  },
};

/** The server's scoreSortValue override, mirrored from the same switch. */
const SORT: Record<string, (raw: number, max: number) => number> = {
  "pinpoint": (raw) => raw,
  "country-draft": (raw) => raw,
  "flag-quiz": (raw) => raw,
  "speed-flags": (raw) => raw,
  "stat-guesser": (raw) => raw,
  "higher-or-lower": (raw) => raw,
  "blind-pick": (raw) => 10000 - raw,
  "geo-wordle": (raw, max) => (max > 0 ? max - raw : 0),
};

const CUT_SLUGS = [
  "world-draft",
  "cluster",
  "risk-zone",
  "supremacy",
  "borderline",
  "blitz",
  "capital-match",
  "population-sort",
  "country-streak",
  "border-buddies",
  "continent-sprint",
  "odd-one-out",
];

function checkMirror(): void {
  current = "mirror of game-runs.ts";
  const src = readFileSync(path.join(process.cwd(), "src/app/actions/game-runs.ts"), "utf8");

  const validateBlock = src.slice(src.indexOf("function validateGameResult("));
  const cases = [...validateBlock.slice(0, validateBlock.indexOf("\n}\n")).matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
  eq(cases.slice().sort(), Object.keys(VALIDATORS).sort(), "validateGameResult covers the same slugs as the mirror");

  const sortBlock = src.slice(src.indexOf("let scoreSortValue = input.scoreSortValue;"));
  const sortCases = [...sortBlock.slice(0, sortBlock.indexOf("const completedAt")).matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
  eq(sortCases.slice().sort(), Object.keys(SORT).sort(), "the scoreSortValue switch covers the same slugs as the mirror");

  for (const slug of CUT_SLUGS) {
    check(!src.includes(`"${slug}"`), `no cut slug ${slug} survives in game-runs.ts`);
  }
}

// --- per-game drivers ---------------------------------------------------------

interface Driver<S> {
  module: GameModule<S, Action>;
  /** Every action a real player would dispatch, in order, derived from the state alone. */
  play(state: S, push: (a: Action) => void): S;
  /** The keys resultJson must carry, so a schema change is loud. */
  resultKeys: string[];
  /** An adversarial payload the structural validator must refuse. */
  tamper(p: SubmitGameRunInput): SubmitGameRunInput;
}

function persists<S>(m: GameModule<S, Action>, a: Action): boolean {
  return m.persist ? m.persist(a) : !a.ui && a.t !== "tick";
}

/** Applies an action, records it when the module persists it, and settles any feedback window. */
function step<S>(m: GameModule<S, Action>, s: S, a: Action, push: (a: Action) => void): S {
  if (persists(m, a)) push(a);
  let next = m.reduce(s, a);
  if (m.feedback && m.feedback.inWindow(next)) {
    if (persists(m, m.feedback.advance)) push(m.feedback.advance);
    next = m.reduce(next, m.feedback.advance);
  }
  return next;
}

const countryDraftDriver: Driver<DraftState> = {
  // Five rounds, five seats: take the first person on offer and fill the lowest free seat.
  module: countryDraft as unknown as GameModule<DraftState, Action>,
  resultKeys: ["score", "fitTotal", "standingTotal", "bonusTotal", "appointments", "poolVersion"],
  tamper: (p) => ({ ...p, scoreRaw: p.scoreRaw + 10 }),
  play(state, push) {
    const m = this.module;
    let s = state;
    let guard = 0;
    while (!m.done(s) && guard < 30) {
      guard += 1;
      if (s.phase === "country") s = step(m, s, {t: "open", c: 0} as Action, push);
      else if(s.phase === "people") {
        const seat = s.seats.findIndex((x) => x === null);
        s = step(m, s, {t: "appoint", i: 0, s: seat} as Action, push);
      } else s = step(m, s, {t: "next"}, push);
    }
    return s;
  },
};

const blindPickDriver: Driver<BlindPickState> = {
  // Six countries, one at a time, each into the leftmost free slot; the tap is final.
  module: blindPick as unknown as GameModule<BlindPickState, Action>,
  resultKeys: ["over", "playerScore", "optimalScore", "placements", "ranks", "perfect", "perfectRanks", "countryIso3s", "stats"],
  tamper: (p) => ({ ...p, scoreRaw: p.scoreRaw + 5 }),
  play(state, push) {
    const m = this.module;
    let s = state;
    let guard = 0;
    while (s.g.placements.length < 6 && guard < 20) {
      guard += 1;
      const free = s.g.config.categories.findIndex((_c, i) => !s.g.placements.includes(i));
      s = step(m, s, { t: "place", s: free } as Action, push);
    }
    return s;
  },
};

const higherOrLowerDriver: Driver<HoLState> = {
  // Ten calls along the chain, right on the odd calls and wrong on the even ones, so the run
  // proves a wrong call does not end the daily and the double calls are scored.
  module: higherOrLower as unknown as GameModule<HoLState, Action>,
  resultKeys: ["stat", "points", "calls", "hits", "chain"],
  tamper: (p) => ({ ...p, scoreRaw: p.scoreRaw + 1 }),
  play(state, push) {
    const m = this.module;
    let s = state;
    let guard = 0;
    while (!m.done(s) && guard < 20) {
      const right = currentAnswer(s);
      const call = guard % 2 === 0 ? right : right === "higher" ? "lower" : "higher";
      guard += 1;
      s = step(m, s, { t: "guess", c: call } as Action, push);
    }
    return s;
  },
};

const geoWordleDriver: Driver<GeoWordleState> = {
  // Six guesses down a fixed walk of the guessable list; stops early on a win.
  module: geoWordle as unknown as GameModule<GeoWordleState, Action>,
  resultKeys: ["answerIso3", "won", "guesses"],
  tamper: (p) => ({ ...p, scoreRaw: 1, resultJson: { ...p.resultJson, won: true } }),
  play(state, push) {
    const m = this.module;
    let s = state;
    const pool = guessableCountries().map((c) => c.iso3);
    let i = 0;
    while (s.phase === "playing" && i < pool.length) {
      const iso3 = pool[i];
      i += 1;
      if (s.guesses.some((g) => g.iso3 === iso3)) continue;
      s = step(m, s, { t: "guess", iso3 } as Action, push);
    }
    return s;
  },
};

const statGuesserDriver: Driver<StatGuesserState> = {
  // Five rounds, each locked at the ruler centre, then the explicit advance.
  module: statGuesser as unknown as GameModule<StatGuesserState, Action>,
  resultKeys: ["v", "total", "points", "guesses", "stats", "targetIso3s"],
  tamper: (p) => ({ ...p, scoreRaw: p.scoreRaw + 10 }),
  play(state, push) {
    const m = this.module;
    let s = state;
    let guard = 0;
    while (s.phase !== "results" && guard < 40) {
      guard += 1;
      if (s.phase === "playing") s = step(m, s, { t: "lock", i: rulerFor(s.rounds[s.currentRound].stat).centre } as Action, push);
      else s = step(m, s, { t: "next" }, push);
    }
    return s;
  },
};

const flagQuizDriver: Driver<QuizState> = {
  // Ten flags, right then wrong alternating, so score, answers and the log all disagree usefully.
  module: flagQuiz as unknown as GameModule<QuizState, Action>,
  resultKeys: ["score", "total", "answers", "hits"],
  tamper: (p) => ({ ...p, scoreRaw: 10 }),
  play(state, push) {
    const m = this.module;
    let s = state;
    let n = 0;
    while (!m.done(s) && n < 40) {
      const q = s.g.questions[s.g.currentQuestion];
      const i = n % 2 === 0 ? q.correctIndex : (q.correctIndex + 1) % 4;
      n += 1;
      s = step(m, s, { t: "answer", i } as Action, push);
    }
    return s;
  },
};

const speedFlagsDriver: Driver<SpeedFlagsState> = {
  // Thirty seconds of wall clock, driven by explicit times; nothing here is persisted.
  module: speedFlags as unknown as GameModule<SpeedFlagsState, Action>,
  resultKeys: ["correct", "wrong", "total", "seconds"],
  tamper: (p) => ({ ...p, scoreRaw: p.scoreRaw + 5 }),
  play(state, push) {
    const m = this.module;
    const t0 = 1_800_000_000_000;
    let s = step(m, state, { t: "start", now: t0 } as Action, push);
    let now = t0;
    let n = 0;
    while (!m.done(s) && n < 200) {
      now += 450;
      s = step(m, s, { t: "unlock", ui: true } as Action, push);
      s = step(m, s, { t: "answer", i: n % 2, now } as Action, push);
      n += 1;
    }
    return step(m, s, { t: "tick", now: t0 + 31_000, ui: true } as Action, push);
  },
};

const pinpointDriver: Driver<PinpointState> = {
  module: pinpoint,
  resultKeys: ["score", "rounds"],
  tamper: (payload) => ({...payload, scoreRaw: payload.scoreRaw + 1}),
  play(state,push) {
    let next=state;
    while(!this.module.done(next)) {
      const action=next.phase === "placing" ? {t:"drop",lat:0,lng:0} : {t:"next"};
      next=step(this.module,next,action,push);
    }
    return next;
  },
};

const drivers = {
  "pinpoint": pinpointDriver,
  "country-draft": countryDraftDriver as unknown as Driver<never>,
  "blind-pick": blindPickDriver as unknown as Driver<never>,
  "higher-or-lower": higherOrLowerDriver as unknown as Driver<never>,
  "geo-wordle": geoWordleDriver as unknown as Driver<never>,
  "stat-guesser": statGuesserDriver as unknown as Driver<never>,
  "flag-quiz": flagQuizDriver as unknown as Driver<never>,
  "speed-flags": speedFlagsDriver as unknown as Driver<never>,
};

// --- the run ------------------------------------------------------------------

function replay<S>(m: GameModule<S, Action>, seed: number, log: readonly Action[]): S {
  let s = m.create(seed, "daily", DATE_KEY);
  for (const a of log) {
    s = m.reduce(s, a);
    if (m.feedback && m.feedback.inWindow(s)) s = m.reduce(s, m.feedback.advance);
  }
  return s;
}

function playOut(slug: GameSlug): { m: GameModule<unknown, Action>; end: unknown; log: Action[]; d: Driver<unknown> } {
  const d = drivers[slug] as unknown as Driver<unknown>;
  const m = d.module;
  const log: Action[] = [];
  const end = d.play(m.create(SEED, "daily", DATE_KEY), (a) => log.push(a));
  return { m, end, log, d };
}

function runGame(slug: GameSlug): void {
  current = slug;
  const { m, end, log, d } = playOut(slug);

  check(m.slug === slug, "module.slug matches its folder");

  const fresh = m.create(SEED, "daily", DATE_KEY);
  eq(fresh, m.create(SEED, "daily", DATE_KEY), "create is deterministic for one seed");
  const other = JSON.stringify(m.create(SEED + 1, "daily", DATE_KEY), replacer);
  check(other !== JSON.stringify(fresh, replacer), "a different seed deals a different board");
  check(!m.done(fresh), "a fresh board is not done");
  check(m.done(end), "the board is done after the driver plays it out");
  check(typeof m.progress(fresh).label === "string", "progress() reads on a fresh board");
  check(typeof m.progress(end).value === "string", "progress() reads on a finished board");

  // 3. codec round trip and replay equality.
  // Speed Flags persists nothing on purpose (a live clock cannot be resumed), so its log is
  // empty by contract and there is no run to replay. Every other game must round-trip.
  const resumable = m.persist ? log.length > 0 : true;
  const encoded = m.codec.enc(log);
  const bytes = Buffer.byteLength(encoded, "utf8");
  check(typeof encoded === "string", "codec.enc returns a string");
  check(bytes <= 900, `the encoded log fits the cookie budget (${bytes} bytes)`);
  const decoded = m.codec.dec(encoded) as Action[];
  eq(m.codec.enc(decoded), encoded, "enc(dec(x)) === x");
  const livePayload = m.payload(end, CTX);
  if (resumable) {
    check(log.length > 0, "the driver dispatched something the module persists");
    const replayed = replay(m, SEED, decoded);
    eq(m.payload(replayed, CTX), livePayload, "replaying the decoded log lands on the same payload");
    eq(m.scoreLabel(replayed), m.scoreLabel(end), "replaying the decoded log lands on the same score label");
    let threw = false;
    try {
      m.codec.dec("~not-a-log~");
    } catch {
      threw = true;
    }
    check(threw, "codec.dec throws on a malformed log");
  } else {
    check(log.length === 0 && encoded === "", "a game that persists nothing writes an empty resume log");
    eq(replay(m, SEED, decoded), fresh, "an empty log replays to a fresh board");
  }

  // 4. the payload shape.
  const p = livePayload;
  eq(p.gameSlug, slug, "payload.gameSlug");
  eq(p.mode, "daily", "payload.mode");
  eq(p.dateKey, DATE_KEY, "payload.dateKey");
  eq(p.startedAt, CTX.startedAt, "payload.startedAt");
  eq(Object.keys(p).sort(), PAYLOAD_KEYS, "the payload has exactly the nine submitGameRun keys");
  check(Number.isFinite(p.scoreRaw), "payload.scoreRaw is a number");
  check(Number.isFinite(p.scoreMax) && p.scoreMax > 0, "payload.scoreMax is a positive number");
  check(Number.isFinite(p.scoreSortValue), "payload.scoreSortValue is a number");
  check(p.scoreRaw <= p.scoreMax, "scoreRaw never exceeds scoreMax (submitGameRun's first gate)");
  check(
    typeof p.scoreDisplay === "string" && p.scoreDisplay.length > 0 && p.scoreDisplay.length <= 32,
    "payload.scoreDisplay is a short string",
  );
  check(!BANNED.test(p.scoreDisplay), "scoreDisplay carries no glyph or em dash");
  for (const key of d.resultKeys) check(key in p.resultJson, `resultJson carries ${key}`);
  check(JSON.stringify(p.resultJson).length < 40_000, "resultJson is small enough to store");
  check(typeof SORT[slug] === "function", "the slug has a scoreSortValue rule on the server");

  // 5. the structural validator that gates submitGameRun.
  eq(VALIDATORS[slug](p.scoreRaw, p.scoreMax, p.resultJson), null, "validateGameResult accepts an honest payload");
  const bad = d.tamper(p);
  check(VALIDATORS[slug](bad.scoreRaw, bad.scoreMax, bad.resultJson) !== null, "validateGameResult refuses a tampered payload");

  // The compact score label the done cookie and the result card both carry.
  const label = m.scoreLabel(end);
  check(typeof label === "string" && label.length > 0 && label.length <= 20, `scoreLabel is compact (${JSON.stringify(label)})`);
  check(!BANNED.test(label), "scoreLabel carries no glyph or em dash");

  console.log(`  ${slug}: ${log.length} actions, ${bytes}-byte log, score ${p.scoreRaw} of ${p.scoreMax}, "${label}"`);
}

function runDailyValidators(): void {
  current = "daily replay validators";

  const cd = playOut("country-draft");
  const cdp = cd.m.payload(cd.end, CTX);
  eq(validateCountryDraftResult(DATE_KEY, cdp.scoreRaw, cdp.resultJson, EDITION).valid, true, "validateCountryDraftResult accepts the honest run");
  eq(validateCountryDraftResult(DATE_KEY, cdp.scoreRaw + 20, cdp.resultJson, EDITION).valid, false, "validateCountryDraftResult refuses a lifted score");

  const bp = playOut("blind-pick");
  const bpp = bp.m.payload(bp.end, CTX);
  eq(validateBlindPickResult(DATE_KEY, bpp.scoreRaw, bpp.resultJson, EDITION).valid, true, "validateBlindPickResult accepts the honest run");
  eq(validateBlindPickResult(DATE_KEY, bpp.scoreRaw + 1, bpp.resultJson, EDITION).valid, false, "validateBlindPickResult refuses a changed score");

  const sg = playOut("stat-guesser");
  const sgp = sg.m.payload(sg.end, CTX);
  eq(validateStatGuesserResult(DATE_KEY, sgp.scoreRaw, sgp.resultJson, EDITION).valid, true, "validateStatGuesserResult accepts the honest run");
  eq(validateStatGuesserResult(DATE_KEY, sgp.scoreRaw + 10, sgp.resultJson, EDITION).valid, false, "validateStatGuesserResult refuses a lifted score");

  const hl = playOut("higher-or-lower");
  const hlp = hl.m.payload(hl.end, CTX);
  eq(validateHigherOrLowerResult(DATE_KEY, hlp.scoreRaw, hlp.resultJson, EDITION).valid, true, "validateHigherOrLowerResult accepts the honest run");
  eq(validateHigherOrLowerResult(DATE_KEY, hlp.scoreRaw + 2, hlp.resultJson, EDITION).valid, false, "validateHigherOrLowerResult refuses a lifted score");

  const fq = playOut("flag-quiz");
  const fqp = fq.m.payload(fq.end, CTX);
  eq(validateFlagQuizResult(DATE_KEY, fqp.scoreRaw, fqp.resultJson, EDITION).valid, true, "validateFlagQuizResult accepts the honest run");
  eq(validateFlagQuizResult(DATE_KEY, Math.min(13, fqp.scoreRaw + 2), fqp.resultJson, EDITION).valid, false, "validateFlagQuizResult refuses a lifted score");
}

/** Concept 5.5: the rank-gap ladder, the direction balance and the 3% rule on 365 daily boards. */
function checkHigherOrLowerBoards(): void {
  current = "higher-or-lower, 365 daily boards";
  for (let d = 0; d < 365; d += 1) {
    const dk = new Date(Date.UTC(2026, 9, 12 + d)).toISOString().slice(0, 10);
    const g = higherOrLower.create(dateSeed(dk + EDITION), "daily", dk).g;
    const dirs = g.chain.slice(0, -1).map((_, i) => answerAt(g, i));
    const highs = dirs.filter((x) => x === "higher").length;
    let run = 1;
    let worst = 1;
    for (let i = 1; i < dirs.length; i += 1) {
      run = dirs[i] === dirs[i - 1] ? run + 1 : 1;
      worst = Math.max(worst, run);
    }
    check(g.chain.length === 11, `${dk}: eleven countries`);
    check(highs >= 4 && highs <= 6 && worst <= 3, `${dk}: direction balance (${highs} higher, longest run ${worst})`);
    for (let i = 0; i < g.chain.length - 1; i += 1) {
      const a = g.chain[i];
      const b = g.chain[i + 1];
      const gap = Math.abs(a.rank - b.rank);
      check(gap >= LADDER[i][0] && gap <= LADDER[i][1], `${dk}: call ${i + 1} rank gap ${gap}`);
      check(farEnough(a.value, b.value), `${dk}: call ${i + 1} is at least 3% apart`);
    }
  }
}

function checkRoster(): void {
  current = "roster";
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/game-registry.json"), "utf8")) as
    | { games: { slug: string }[] }
    | { slug: string }[];
  const list = Array.isArray(raw) ? raw : raw.games;
  const slugs = list.map((g) => g.slug);
  eq(
    slugs,
    ["country-draft", "geo-wordle", "pinpoint", "flag-quiz", "higher-or-lower", "stat-guesser", "blind-pick", "speed-flags"],
    "game-registry.json holds the roster in order",
  );
  eq(Object.keys(drivers).slice().sort(), slugs.slice().sort(), "every registry slug has a contract driver");
}

console.log(`check-contracts: playing every board on ${DATE_KEY} (seed ${SEED})`);
checkRoster();
checkMirror();
for (const slug of Object.keys(drivers) as GameSlug[]) runGame(slug);
runDailyValidators();
checkHigherOrLowerBoards();

console.log(`check-contracts: ${checks} assertions, ${failures} failure(s)`);
if (failures) process.exit(1);
console.log("check-contracts: clean");
