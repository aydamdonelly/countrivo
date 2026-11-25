/*
 * Flag Quiz sprint regression. Pure engine checks plus the real server session code
 * (prepareFlagSession / commitFlagSession over commitGameSession) running against an
 * in-memory database. Nothing here opens a network connection: the Supabase client, the
 * Next request APIs and `server-only` are replaced before any server module loads, and the
 * environment points at a closed local port.
 *
 *   1. the daily sequence is deterministic per seed, sixty distinct sovereign flags, four
 *      distinct names each, widely known openers, lookalike names where the family has them
 *   2. a view never carries a later flag, the answer to the flag on screen, or the board
 *   3. the server deadline: in-flight grace, late answers, the finish move
 *   4. the two-second penalty per wrong answer
 *   5. stale and duplicate requests return the committed result and change nothing
 *   6. practice leaves out today's daily flags; a frozen ten-flag day keeps its rules
 *   7. the move log stays compact and round-trips
 *
 * Run: npx tsx scripts/check-flag-sprint.ts
 */
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "offline-check";
process.env.COUNTRIVO_SUPABASE_SERVICE_KEY = "offline-check";
process.env.COUNTRIVO_GAME_SECRET = "offline-check-secret-0123456789abcdef";

// ── an in-memory stand-in for the three tables the session touches ───────────────────────

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = { countrivo_runs: [], countrivo_boards: [], countrivo_config: [{ key: "daily_edition", value: "offline-edition" }] };
let nextId = 1;
let writes = 0;

class Query implements PromiseLike<{ data: unknown; error: unknown; count?: number }> {
  private op: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private filters: ((r: Row) => boolean)[] = [];
  private mode: "many" | "maybe" | "single" = "many";
  private head = false;
  private ignore = false;
  constructor(private table: string) {}
  select(_cols?: string, opts?: { head?: boolean }) { if (opts?.head) this.head = true; return this; }
  insert(row: Row) { this.op = "insert"; this.payload = row; return this; }
  update(patch: Row) { this.op = "update"; this.payload = patch; return this; }
  upsert(rows: Row | Row[], opts?: { ignoreDuplicates?: boolean }) { this.op = "upsert"; this.payload = rows; this.ignore = !!opts?.ignoreDuplicates; return this; }
  eq(col: string, value: unknown) { this.filters.push((r) => r[col] === value); return this; }
  in(col: string, values: unknown[]) { this.filters.push((r) => values.includes(r[col])); return this; }
  gte(col: string, value: string) { this.filters.push((r) => String(r[col]) >= value); return this; }
  lte(col: string, value: string) { this.filters.push((r) => String(r[col]) <= value); return this; }
  lt(col: string, value: string) { this.filters.push((r) => String(r[col]) < value); return this; }
  order() { return this; }
  limit() { return this; }
  abortSignal() { return this; }
  returns() { return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  single() { this.mode = "single"; return this; }
  private rows() { return (tables[this.table] ??= []); }
  private result(found: Row[]) {
    if (this.head) return { data: null, error: null, count: found.length };
    if (this.mode === "many") return { data: found.map((r) => ({ ...r })), error: null, count: found.length };
    if (this.mode === "single" && found.length !== 1) return { data: null, error: { message: "not one row" } };
    return { data: found[0] ? { ...found[0] } : null, error: null };
  }
  private conflict(row: Row): boolean {
    const rows = this.rows();
    if (this.table === "countrivo_runs") {
      return rows.some((r) => r.session_id === row.session_id || (row.mode === "daily" && r.mode === "daily" && r.device_id === row.device_id && r.game_slug === row.game_slug && r.date_key === row.date_key && r.edition === row.edition));
    }
    if (this.table === "countrivo_boards") return rows.some((r) => r.game_slug === row.game_slug && r.date_key === row.date_key && r.edition === row.edition);
    return false;
  }
  private run() {
    const rows = this.rows();
    if (this.op === "select") return this.result(rows.filter((r) => this.filters.every((f) => f(r))));
    if (this.op === "insert") {
      const row = { id: nextId++, status: "open", revision: 0, action_log: "", display_name: null, moderation_hidden: false, place_country_code: null, ...(this.payload as Row) };
      if (this.conflict(row)) return { data: null, error: { message: "duplicate key" } };
      rows.push(row);
      writes++;
      return this.result([row]);
    }
    if (this.op === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const row of list) if (!this.conflict(row)) { rows.push({ ...row }); writes++; } else if (!this.ignore) return { data: null, error: { message: "duplicate key" } };
      return { data: null, error: null };
    }
    const hit = rows.filter((r) => this.filters.every((f) => f(r)));
    for (const r of hit) Object.assign(r, this.payload);
    if (hit.length) writes++;
    return this.result(hit);
  }
  then<A, B>(ok?: ((v: { data: unknown; error: unknown; count?: number }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(ok, bad);
  }
}

class Rpc implements PromiseLike<{ data: null; error: { code: string; message: string } }> {
  abortSignal() { return this; }
  returns() { return this; }
  then<A, B>(ok?: ((v: { data: null; error: { code: string; message: string } }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve({ data: null, error: { code: "offline", message: "offline check" } }).then(ok, bad);
  }
}

const fakeClient = { from: (table: string) => new Query(table), rpc: () => new Rpc() };
const jar = new Map<string, string>();
const fakeCookies = { get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) ?? "" } : undefined), set: (name: string, value: string) => { jar.set(name, value); } };

interface Loader { _load(request: string, parent: unknown, isMain: boolean): unknown }
const loader = Module as unknown as Loader;
const realLoad = loader._load.bind(Module);
loader._load = (request, parent, isMain) => {
  if (request === "server-only") return {};
  if (request === "@supabase/supabase-js") return { createClient: () => fakeClient };
  if (request === "next/headers") return { cookies: async () => fakeCookies, headers: async () => new Map() };
  if (request === "next/cache") return { unstable_cache: <F>(fn: F) => fn, revalidatePath() {}, revalidateTag() {}, updateTag() {} };
  return realLoad(request, parent, isMain);
};

const load = createRequire(__filename);
type Sprint = typeof import("../src/lib/game-logic/flag-quiz/sprint");
type Sessions = typeof import("../src/server/quick-sessions");
type Identity = typeof import("../src/server/anonymous-identity");
type Views = typeof import("../src/games/quick-views");
type Pools = typeof import("../src/lib/game-logic/flag-quiz/pools");
type Seeded = typeof import("../src/lib/seeded-random");
type DailySeed = typeof import("../src/lib/daily-seed");
type SprintModule = typeof import("../src/games/flag-quiz/module");
type Engine = typeof import("../src/lib/game-logic/flag-quiz/engine");
const sprint: Sprint = load("../src/lib/game-logic/flag-quiz/sprint.ts");
const sessions: Sessions = load("../src/server/quick-sessions.ts");
const identity: Identity = load("../src/server/anonymous-identity.ts");
const views: Views = load("../src/games/quick-views.ts");
const pools: Pools = load("../src/lib/game-logic/flag-quiz/pools.ts");
const { mulberry32 }: Seeded = load("../src/lib/seeded-random.ts");
const { getTodayDateKey }: DailySeed = load("../src/lib/daily-seed.ts");
const { gameModule, FLAG_SPRINT_VERSION }: SprintModule = load("../src/games/flag-quiz/module.ts");
const { countryOf }: Engine = load("../src/lib/game-logic/flag-quiz/engine.ts");
loader._load = realLoad;

type View = import("../src/games/quick-views").QuickView;
type SprintView = import("../src/games/quick-views").FlagSprintView;
type SprintState = import("../src/lib/game-logic/flag-quiz/sprint").SprintState;

let checks = 0;
function check(ok: unknown, what: string): void { assert.ok(ok, what); checks++; }

// ── 1. the daily sequence ────────────────────────────────────────────────────────────────

const KNOWN = new Set(pools.KNOWN);
const families = pools.LOOKALIKES.map((set) => new Set([...set.core, ...set.kin]));
for (let d = 0; d < 120; d++) {
  const dateKey = new Date(Date.UTC(2026, 10, 26 + d)).toISOString().slice(0, 10);
  const seed = identity.dailyBoardSeed("flag-quiz", dateKey, "offline-edition");
  const a = sprint.createSprint(mulberry32(seed));
  check(JSON.stringify(a) === JSON.stringify(sprint.createSprint(mulberry32(seed))), `${dateKey}: one seed, one sequence`);
  check(JSON.stringify(gameModule.create(seed, "daily", dateKey)) === JSON.stringify(a), `${dateKey}: the module deals the engine's sequence`);
  check(a.flags.length === sprint.SPRINT_LENGTH && new Set(a.flags.map((f) => f.iso3)).size === sprint.SPRINT_LENGTH, `${dateKey}: sixty distinct flags`);
  check(a.flags.slice(0, sprint.SPRINT_OPENERS).every((f) => KNOWN.has(f.iso3)), `${dateKey}: widely known openers`);
  for (const flag of a.flags) {
    check(flag.options.length === 4 && new Set(flag.options).size === 4 && flag.options[flag.correctIndex] === flag.iso3, `${dateKey}: four distinct names with the answer`);
    const family = families.find((set) => set.has(flag.iso3));
    if (family) check(flag.options.some((o) => o !== flag.iso3 && family.has(o)), `${dateKey}: a lookalike name for ${flag.iso3}`);
  }
}
const s1 = sprint.createSprint(mulberry32(1)), s2 = sprint.createSprint(mulberry32(2));
check(s1.flags.map((f) => f.iso3).join() !== s2.flags.map((f) => f.iso3).join(), "a different seed deals a different sequence");

// ── 7. the move log ──────────────────────────────────────────────────────────────────────

{
  const t0 = 1_764_000_000_000;
  const log = [{ t: "start" as const, at: t0 }, ...Array.from({ length: 40 }, (_, k) => ({ t: "answer" as const, i: k % 4, at: t0 + 450 * (k + 1) })), { t: "finish" as const, at: t0 + 20_100 }];
  const encoded = gameModule.codec.enc(log);
  check(encoded.length < 512, `forty answers fit the session cursor (${encoded.length} chars)`);
  check(JSON.stringify(gameModule.codec.dec(encoded)) === JSON.stringify(log), "the log round-trips");
  check(gameModule.codec.enc(gameModule.codec.dec(encoded)) === encoded, "enc(dec(x)) is x");
  check(/^[A-D][0-9a-z]+$/.test(gameModule.codec.enc([log[5]])), "a single move carries an absolute time");
  assert.throws(() => gameModule.codec.dec('[{"t":"answer","i":1}]')); checks++;
  assert.throws(() => gameModule.codec.dec("a12")); checks++;
}

// ── the session harness ──────────────────────────────────────────────────────────────────

const today = getTodayDateKey();
const EDITION = "offline-edition";
const HASH = /[a-f0-9]{40}/g;

interface Session { token: string; revision: number; view: View }

async function open(mode: "daily" | "practice"): Promise<Session> {
  const seed = mode === "daily" ? identity.dailyBoardSeed("flag-quiz", today, EDITION) : 424242;
  const r = await sessions.prepareFlagSession({ slug: "flag-quiz", mode, dateKey: today, edition: EDITION, seed, startedAt: new Date().toISOString() });
  return { token: r.sessionToken, revision: r.revision, view: r.view };
}

async function move(s: Session, action: import("../src/games/quick-views").QuickAction, at: number, revision = s.revision, token = s.token): Promise<Session> {
  const ticket = identity.readRunTicket(token);
  assert.ok(ticket, "a valid ticket");
  const r = await sessions.commitFlagSession(ticket, { sessionToken: token, revision, action }, at);
  return { token: r.sessionToken, revision: r.revision, view: r.view };
}

function asSprint(view: View): SprintView {
  assert.ok(views.isFlagSprint(view), "a sprint view");
  return view;
}

function storedRun(): Row {
  const row = tables.countrivo_runs.at(-1);
  assert.ok(row, "a stored run");
  return row;
}

function storedState(mode: "daily" | "practice", row: Row, exclude?: ReadonlySet<string>): SprintState {
  if (mode === "daily") {
    const board = tables.countrivo_boards.find((b) => b.game_slug === "flag-quiz" && b.date_key === today);
    assert.ok(board && sprint.isSprintState(board.solution), "the daily sprint board is frozen");
    return board.solution;
  }
  return sprint.createSprint(mulberry32(Number(row.seed)), exclude);
}

/** The view carries the flag on screen and nothing about any other flag of the board. */
function assertSanitized(view: View, board: SprintState, label: string): void {
  const v = asSprint(view);
  const json = JSON.stringify(v);
  const allowed = new Set(["kind", "format", "mode", "stage", "phase", "round", "total", "score", "progress", "shareText", "history", "flagSrc", "options", "correct", "wrong", "seconds", "penaltySeconds", "target", "deadline", "serverNow", "last", "seen"]);
  check(Object.keys(v).every((k) => allowed.has(k)), `${label}: only public keys`);
  check(!/correctIndex|"flags"|"iso3"|"answers"/.test(json), `${label}: no answer index, board, iso3 or answer log`);
  const hashes = new Set(json.match(HASH) ?? []);
  const onScreen = v.stage === "running" ? board.flags[v.round] : null;
  const expected = onScreen ? sessions.opaqueFlagSrc(countryOf(onScreen.iso3).iso2) : null;
  check(hashes.size === (expected ? 1 : 0) && (!expected || v.flagSrc === expected), `${label}: only the opaque flag on screen`);
  if (v.stage === "running" && onScreen) {
    check(JSON.stringify(v.options) === JSON.stringify(onScreen.options.map(sprint.sprintName)), `${label}: the four names of the flag on screen`);
    check(v.seen.length === 0 && v.history.length === 0 && v.shareText === "", `${label}: nothing listed while the clock runs`);
  }
  if (v.stage === "ready") check(v.flagSrc === null && v.options.length === 0 && v.deadline === null, `${label}: no flag before the start`);
}

async function main(): Promise<void> {
  const T = Date.now();

  // ── 2, 3, 4, 5 on the daily board ──
  let s = await open("daily");
  check(asSprint(s.view).stage === "ready", "the daily opens on the ready card");
  const writesBeforeStart = writes;
  s = await move(s, { t: "start" }, T);
  check(writes > writesBeforeStart, "the start is stored");
  const board = storedState("daily", storedRun());
  assertSanitized(s.view, board, "after start");
  check(asSprint(s.view).deadline === T + sprint.SPRINT_MS, "the deadline is the server start plus twenty seconds");

  const dup = await move(s, { t: "start" }, T + 5000, 0);
  check(asSprint(dup.view).deadline === T + sprint.SPRINT_MS && dup.revision === s.revision, "a duplicate start does not restart the clock");

  const right = (k: number) => board.flags[k].correctIndex;
  const wrongPick = (k: number) => (board.flags[k].correctIndex + 1) % 4;
  s = await move(s, { t: "answer", i: right(0) }, T + 1000);
  assertSanitized(s.view, board, "after a right answer");
  check(asSprint(s.view).correct === 1 && asSprint(s.view).deadline === T + sprint.SPRINT_MS, "a right answer keeps the deadline");

  const before = s;
  s = await move(s, { t: "answer", i: wrongPick(1) }, T + 2000);
  assertSanitized(s.view, board, "after a wrong answer");
  check(asSprint(s.view).deadline === T + sprint.SPRINT_MS - sprint.PENALTY_MS, "a wrong answer costs two seconds");
  check(asSprint(s.view).last?.correct === false && asSprint(s.view).last?.answer === sprint.sprintName(board.flags[1].iso3), "the miss names the right country");

  // A lost response: the client retries the same move at the old revision with the old token.
  const log = storedRun().action_log;
  const retry = await move(before, { t: "answer", i: wrongPick(1) }, T + 2600);
  check(retry.revision === s.revision && JSON.stringify({ ...asSprint(retry.view), serverNow: 0 }) === JSON.stringify({ ...asSprint(s.view), serverNow: 0 }), "a retried move returns the committed view");
  const conflicting = await move(before, { t: "answer", i: right(1) }, T + 2700);
  check(asSprint(conflicting.view).wrong === 1 && storedRun().action_log === log, "a stale conflicting move changes nothing");

  s = await move(s, { t: "answer", i: wrongPick(2) }, T + 3000);
  check(asSprint(s.view).deadline === T + sprint.SPRINT_MS - 2 * sprint.PENALTY_MS, "two wrong answers cost four seconds");

  // Run the clock out: an answer 1.4 s after the shortened deadline was in flight and counts.
  let k = 3;
  for (let at = T + 4000; at < T + 15_000; at += 1000) { s = await move(s, { t: "answer", i: right(k) }, at); k++; assertSanitized(s.view, board, `running at ${at - T} ms`); }
  const deadline = asSprint(s.view).deadline ?? 0;
  check(deadline === T + 16_000, "the deadline holds after right answers");
  const countBefore = asSprint(s.view).correct;
  s = await move(s, { t: "answer", i: right(k) }, deadline + 1400);
  check(asSprint(s.view).stage === "finished" && asSprint(s.view).correct === countBefore + 1, "an answer inside the grace window counts and ends the run");
  check(storedRun().status === "complete" && storedRun().score_raw === countBefore + 1 && storedRun().score_sort_value === countBefore + 1, "the stored score is the count, higher is better");
  check(storedRun().score_display === `${countBefore + 1} flags`, "the stored display reads in flags");
  const finished = asSprint(s.view);
  check(finished.seen.length === finished.correct + finished.wrong && finished.seen.filter((r) => !r.correct).every((r) => r.guess !== null), "the result lists every answered flag with the pick");
  check(/^Countrivo Flag Quiz \d+ \w{3}: \d+ flags in 20 s\n/.test(finished.shareText) && !/[A-Z][a-z]+ia\b/.test(finished.shareText.split("\n").slice(1).join("")), "the share text has the count and no country name");
  const after = await move(s, { t: "answer", i: 0 }, deadline + 1500);
  check(asSprint(after.view).correct === finished.correct && storedRun().score_raw === finished.correct, "a move after the end changes nothing");

  // ── 3 on practice: a late answer ends the run without counting; the finish move ──
  let p = await open("practice");
  const dailyAnswers = new Set(board.flags.map((f) => f.iso3));
  p = await move(p, { t: "start" }, T);
  const practiceBoard = storedState("practice", storedRun(), dailyAnswers);
  const dailySources = new Set(board.flags.map((flag) => sessions.opaqueFlagSrc(countryOf(flag.iso3).iso2)));
  check(practiceBoard.flags.every((f) => !dailyAnswers.has(f.iso3)) && !dailySources.has(asSprint(p.view).flagSrc ?? ""), "practice leaves out today's daily flags");
  check(storedRun().state_json !== null && (storedRun().state_json as Row).contentVersion === FLAG_SPRINT_VERSION, "practice sessions carry the sprint content version");
  assertSanitized(p.view, practiceBoard, "practice after start");
  p = await move(p, { t: "answer", i: practiceBoard.flags[0].correctIndex }, T + 1000);
  p = await move(p, { t: "answer", i: practiceBoard.flags[1].correctIndex }, T + sprint.SPRINT_MS + sprint.GRACE_MS + 1);
  check(asSprint(p.view).stage === "finished" && asSprint(p.view).correct === 1, "an answer after the grace window ends the run uncounted");
  check(asSprint(p.view).seen.at(-1)?.guess === null, "the flag left on screen is listed as unanswered");

  let f = await open("practice");
  f = await move(f, { t: "start" }, T);
  f = await move(f, { t: "finish" }, T + 20_050);
  check(asSprint(f.view).stage === "finished" && asSprint(f.view).correct === 0 && storedRun().status === "complete", "the finish move closes a run at zero");
  await assert.rejects(move(f, { t: "next" }, T + 21_000)); checks++;

  // ── 6. a day frozen under the ten-flag quiz keeps its rules ──
  const legacyDay = "2026-11-24";
  tables.countrivo_boards.push({ game_slug: "flag-quiz", date_key: legacyDay, edition: EDITION, seed: 1, solution: { g: { questions: [] }, pending: null } });
  check(await sessions.flagFormat("practice", legacyDay, EDITION, undefined, true) === "quiz", "an archived ten-flag board stays a quiz");
  check(await sessions.flagFormat("daily", today, EDITION) === "sprint", "today's sprint board stays a sprint");
  check(await sessions.flagFormat("practice", today, EDITION, "europe") === "quiz", "Europe flags practice stays a quiz");
}

main().then(() => {
  console.log(`check-flag-sprint: ${checks} checks passed; in-memory database only (${writes} writes)`);
}, (error: unknown) => {
  console.error(error);
  process.exit(1);
});
