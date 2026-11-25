/*
 * The Capital Quiz engine gate. Deals thousands of boards in every filter and asserts:
 *   1. a seed deals the same board twice, and another seed deals another board,
 *   2. every board is ten distinct countries from the chosen filter,
 *   3. every question has four distinct cities and exactly one of them counts,
 *   4. countries that split the capital role (South Africa, Bolivia) offer exactly one of
 *      their accepted capitals and none of the others,
 *   5. no country without an accepted capital (the disputed ones) is ever dealt, and none of
 *      their cities is offered; no country whose name gives its capital away is dealt,
 *   6. distractors are nearby: same subregion when it has three other countries, else region,
 *   7. picks, next, the filter guard and the score behave, and the codec round-trips a run,
 *   8. the server replay of a finished log lands on the payload the board produced.
 *
 * Run: npx tsx scripts/check-capital-quiz.ts
 */
import assert from "node:assert/strict";
import { CAPITAL_OVERRIDES, DISPUTED_CAPITAL_COUNTRIES } from "../src/content/capitals";
import { capitalsAccepted, countries, sovereignIso3 } from "../src/lib/data/public";
import { mulberry32 } from "../src/lib/seeded-random";
import {
  ASKABLE_POOL,
  CAPITAL_POOL,
  CAPITAL_REGIONS,
  OPTION_COUNT,
  ROUNDS,
  canChooseRegion,
  createCapitalQuiz,
  namesItsCapital,
  next,
  pick,
  poolFor,
  questionFor,
  regionSeed,
  type CapitalQuestion,
} from "../src/lib/game-logic/capital-quiz/engine";
import { gameModule, type CapitalAction } from "../src/games/capital-quiz/module";
import { codec } from "../src/games/capital-quiz/codec";
import { replay } from "../src/features/play/replay";

let checks = 0;
function ok(value: unknown, what: string): void {
  checks += 1;
  assert.ok(value, what);
}

const BY_ISO3 = new Map(countries.map((c) => [c.iso3, c]));
const ENTRY = new Map(CAPITAL_POOL.map((e) => [e.iso3, e]));
/** Every city that is an accepted capital somewhere in the pool. */
const POOL_CITIES = new Set(CAPITAL_POOL.flatMap((e) => e.capitals));
/** The cities of countries that are never dealt. */
const EXCLUDED = countries.filter((c) => sovereignIso3.includes(c.iso3) && !ENTRY.has(c.iso3));
const EXCLUDED_CITIES = new Set(EXCLUDED.map((c) => c.capital).filter((city) => city && !POOL_CITIES.has(city)));

// The pool: sovereign states with a capital (193), less the ones whose name gives the capital
// away; the landing copy says 179 and names Monaco, Mexico and Tunisia among them.
ok(CAPITAL_POOL.length === 193, `193 sovereign states have an accepted capital (got ${CAPITAL_POOL.length})`);
ok(ASKABLE_POOL.length === 179, `179 countries can be asked about (got ${ASKABLE_POOL.length})`);
for (const iso3 of ["MCO", "MEX", "TUN", "SGP", "VAT", "KWT"]) ok(!ASKABLE_POOL.some((e) => e.iso3 === iso3) && namesItsCapital(ENTRY.get(iso3)!), `${iso3} names its capital and is never asked`);
ok(!namesItsCapital(ENTRY.get("FRA")!) && !namesItsCapital(ENTRY.get("BRA")!), "France and Brazil are asked");
ok(CAPITAL_POOL.every((e) => sovereignIso3.includes(e.iso3) && e.capitals.length > 0), "the pool is sovereign states with at least one accepted capital");
for (const iso3 of DISPUTED_CAPITAL_COUNTRIES) {
  ok(!ENTRY.has(iso3), `${iso3}, a disputed capital, is never dealt`);
  ok((capitalsAccepted[iso3] ?? []).length === 0, `${iso3} has no accepted capital in the data`);
}
ok(EXCLUDED_CITIES.size >= DISPUTED_CAPITAL_COUNTRIES.length, "the excluded countries' cities are known so they can be kept out of the options");
for (const r of CAPITAL_REGIONS) ok(poolFor(r).length >= ROUNDS, `the ${r} pool holds at least ten countries`);

function checkQuestion(q: CapitalQuestion, where: string): void {
  const entry = ENTRY.get(q.iso3);
  ok(entry, `${where}: ${q.iso3} is in the pool`);
  if (!entry) return;
  if (!where.endsWith("/direct") && !/^[A-Z]{3}\//.test(where)) ok(!namesItsCapital(entry), `${where}: ${q.country} does not name its capital`);
  ok(q.options.length === OPTION_COUNT, `${where}: four options`);
  ok(new Set(q.options).size === OPTION_COUNT, `${where}: four distinct cities (${q.options.join(", ")})`);
  ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < OPTION_COUNT, `${where}: the right index is on the board`);
  const counting = q.options.filter((city) => entry.capitals.includes(city));
  ok(counting.length === 1, `${where}: exactly one option is a capital of ${q.country} (${counting.join(", ")})`);
  ok(entry.capitals.includes(q.options[q.correctIndex]), `${where}: the right option is an accepted capital`);
  ok(q.accepted === entry.capitals, `${where}: the accepted list is the data's`);
  for (const city of q.options) {
    ok(POOL_CITIES.has(city), `${where}: ${city} is a capital of a dealt country`);
    ok(!EXCLUDED_CITIES.has(city), `${where}: ${city} is not a disputed capital`);
  }
  // Distractors: the subregion's capitals first, then the region's.
  const others = CAPITAL_POOL.filter((c) => c.iso3 !== entry.iso3);
  const sameSub = others.filter((c) => c.subregion === entry.subregion);
  const sameRegion = others.filter((c) => c.region === entry.region);
  const owner = (city: string) => CAPITAL_POOL.find((c) => c.capitals[0] === city);
  for (const city of q.options) {
    if (city === q.options[q.correctIndex]) continue;
    const o = owner(city);
    ok(o, `${where}: ${city} is a primary capital of another country`);
    if (!o) continue;
    if (sameSub.length >= OPTION_COUNT - 1) ok(o.subregion === entry.subregion, `${where}: ${city} is from ${entry.subregion}`);
    else if (sameRegion.length >= OPTION_COUNT - 1) ok(o.region === entry.region, `${where}: ${city} is from ${entry.region}`);
  }
  const override = CAPITAL_OVERRIDES[entry.iso3];
  ok(q.prompt === (override?.question ?? null), `${where}: the split-capital prompt comes from the cited override`);
  ok(q.explanation.length > 0 && !/[—!]/.test(q.explanation), `${where}: the answer line has no em dash or exclamation mark`);
}

// 1, 2, 3, 5, 6 over many boards in every filter.
let boards = 0;
const dealt = new Set<string>();
for (const region of CAPITAL_REGIONS) {
  const keep = poolFor(region).map((e) => e.iso3);
  for (let seed = 1; seed <= 600; seed += 1) {
    const a = createCapitalQuiz(mulberry32(regionSeed(seed, region)), region);
    const b = createCapitalQuiz(mulberry32(regionSeed(seed, region)), region);
    assert.deepEqual(a, b, `${region}/${seed}: the same seed deals the same board`);
    checks += 1;
    ok(a.questions.length === ROUNDS && a.answers.length === ROUNDS, `${region}/${seed}: ten rounds`);
    ok(new Set(a.questions.map((q) => q.iso3)).size === ROUNDS, `${region}/${seed}: ten distinct countries`);
    ok(a.questions.every((q) => keep.includes(q.iso3)), `${region}/${seed}: every country is in the filter`);
    a.questions.forEach((q, i) => {
      dealt.add(q.iso3);
      checkQuestion(q, `${region}/${seed}#${i + 1}`);
    });
    boards += 1;
  }
  const one = JSON.stringify(createCapitalQuiz(mulberry32(regionSeed(7, region)), region));
  const two = JSON.stringify(createCapitalQuiz(mulberry32(regionSeed(8, region)), region));
  ok(one !== two, `${region}: another seed deals another board`);
}
ok(dealt.size === ASKABLE_POOL.length, `every askable country is dealt somewhere (${dealt.size} of ${ASKABLE_POOL.length})`);
const worldFirst = createCapitalQuiz(mulberry32(regionSeed(11, "world")), "world").questions.map((q) => q.iso3).join();
const europeFirst = createCapitalQuiz(mulberry32(regionSeed(11, "europe")), "europe").questions.map((q) => q.iso3).join();
ok(worldFirst !== europeFirst, "a filter re-deals rather than reusing the world board");

// 4. Split capitals, forced: every accepted capital is offered sometimes, always alone.
for (const iso3 of Object.keys(CAPITAL_OVERRIDES)) {
  const entry = ENTRY.get(iso3);
  ok(entry && entry.capitals.length === CAPITAL_OVERRIDES[iso3].accepted.length, `${iso3}: the override's capitals are the accepted list`);
  if (!entry) continue;
  const offered = new Set<string>();
  for (let seed = 1; seed <= 300; seed += 1) {
    const q = questionFor(entry, mulberry32(seed));
    checkQuestion(q, `${iso3}/${seed}`);
    offered.add(q.options[q.correctIndex]);
  }
  ok(offered.size === entry.capitals.length, `${iso3}: each of its ${entry.capitals.length} capitals is the offered one on some board`);
}
// Every dealt question everywhere, for the single-capital countries too.
for (const entry of CAPITAL_POOL) checkQuestion(questionFor(entry, mulberry32(entry.iso3.charCodeAt(0) * 977)), `${entry.iso3}/direct`);

// 7. The engine and the module.
{
  let s = createCapitalQuiz(mulberry32(42), "world");
  ok(canChooseRegion(s), "the filter is open on a fresh board");
  ok(pick(s, 4) === s && pick(s, -1) === s && pick(s, 1.5) === s, "an index off the board is ignored");
  ok(next(s) === s, "next before a pick is ignored");
  const q = s.questions[0];
  s = pick(s, q.correctIndex);
  ok(s.phase === "reveal" && s.score === 1, "a right pick scores 1 and opens the reveal");
  ok(!canChooseRegion(s), "the filter closes after the first pick");
  ok(pick(s, 0) === s, "a second pick during the reveal is ignored");
  s = next(s);
  ok(s.phase === "question" && s.current === 1, "next moves to the second country");
  s = pick(s, (s.questions[1].correctIndex + 1) % 4);
  ok(s.score === 1 && s.phase === "reveal", "a wrong pick scores nothing and still reveals");
}
{
  const m = gameModule;
  let s = m.create(123, "practice", "2026-11-25");
  const fresh = s;
  ok(m.reduce(s, { t: "region", r: "world" }) === s, "choosing the current filter changes nothing");
  s = m.reduce(s, { t: "region", r: "asia" });
  ok(s.g.region === "asia" && s.seed === 123, "the filter re-deals from the same seed");
  const log: CapitalAction[] = [{ t: "region", r: "oceania" }, { t: "region", r: "asia" }];
  let k = 0;
  while (!m.done(s) && k < 40) {
    const a: CapitalAction = s.g.phase === "question" ? { t: "pick", i: (s.g.current * 3) % 4 } : { t: "next" };
    s = m.reduce(s, a);
    log.push(a);
    k += 1;
  }
  ok(m.done(s), "ten picks and ten nexts finish the board");
  ok(m.reduce(s, { t: "region", r: "europe" }) === s, "the filter is closed on a finished board");
  const enc = codec.enc(log);
  ok(enc.startsWith("c1rs") && enc.length === 24, `the log folds the filter to its last choice (${enc})`);
  assert.deepEqual(codec.dec(enc).map((a) => a.t), ["region", ...log.slice(2).map((a) => a.t)]);
  checks += 1;
  ok(codec.enc(codec.dec(enc)) === enc, "enc(dec(x)) === x");
  for (const bad of ["", "q2", "c1r", "c1rz", "c15", "c1x", `c1${"0".repeat(60)}`]) {
    let threw = false;
    try {
      codec.dec(bad);
    } catch {
      threw = true;
    }
    ok(threw, `dec refuses ${JSON.stringify(bad)}`);
  }
  const ctx = { mode: "practice" as const, dateKey: "2026-11-25", startedAt: "2026-11-25T10:00:00.000Z" };
  const replayed = replay(m, 123, "practice", "2026-11-25", enc);
  assert.deepEqual(m.payload(replayed.state, ctx), m.payload(s, ctx), "the replayed log lands on the same payload");
  checks += 1;
  const p = m.payload(s, ctx);
  ok(p.gameSlug === "capital-quiz" && p.scoreMax === 10 && p.scoreRaw === s.g.score && p.scoreDisplay === `${s.g.score} of 10`, "the payload carries the score of ten");
  ok(Array.isArray(p.resultJson.hits) && (p.resultJson.hits as boolean[]).filter(Boolean).length === p.scoreRaw, "the hits add up to the score");
  ok(m.scoreLabel(s) === `${s.g.score} of 10`, "the score label");
  const share = m.share?.(s, { mode: "practice", dateKey: ctx.dateKey, title: "Capital Quiz", rank: null }) ?? "";
  ok(share.endsWith("\nhttps://countrivo.com/games/capital-quiz") && share.includes(", Asia") && !share.includes(s.g.questions[0].country), "the share is spoiler-free and ends with the link");
  ok(JSON.stringify(m.create(123, "practice", "2026-11-25")) === JSON.stringify(fresh), "create is pure");
}

// The data the game reads is the data the country pages read.
for (const e of CAPITAL_POOL) {
  const c = BY_ISO3.get(e.iso3);
  ok(c && (e.capitals.includes(c.capital) || CAPITAL_OVERRIDES[e.iso3]), `${e.iso3}: the country record's capital is accepted`);
}

console.log(`check-capital-quiz: ${boards} boards in ${CAPITAL_REGIONS.length} filters, ${checks} assertions, clean`);
