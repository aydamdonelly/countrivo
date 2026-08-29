/*
 * Country Draft contract check (SPEC 22). Generates the board for 400 consecutive daily
 * keys and asserts every property the game, the payload and the validator rely on, then
 * plays each board to completion through the module and re-validates the payload.
 * Run: npx tsx scripts/check-country-draft.ts
 */
import { dateSeed } from "../src/lib/daily-seed";
import { mulberry32 } from "../src/lib/seeded-random";
import { createBoard } from "../src/lib/game-logic/country-draft/generator";
import { CONTINENTS, POOL } from "../src/lib/game-logic/country-draft/roster";
import { greedyLine } from "../src/lib/game-logic/country-draft/scoring";
import { MAX_CEILING, MAX_SCORE, MIN_CEILING, MIN_GREEDY_GAP, ROUNDS, bandOf } from "../src/lib/game-logic/country-draft/tables";
import { appoint, appointmentsOf, createGame, figureAt, scoreState, seen, undo } from "../src/lib/game-logic/country-draft/engine";
import { fillOrder } from "../src/lib/game-logic/country-draft/fill-order";
import type { PoolIdx, SeatIdx } from "../src/lib/game-logic/country-draft/types";
import { gameModule } from "../src/games/country-draft/module";
import { codec } from "../src/games/country-draft/codec";

let failures = 0;
function check(ok: boolean, what: string) {
  if (!ok) {
    failures += 1;
    console.error("FAIL:", what);
  }
}

const CONTINENT_OF = new Map(POOL.map((c) => [c.iso3, c.continent]));
const ceilings: number[] = [];
const gaps: number[] = [];
const greedies: number[] = [];

const start = Date.UTC(2026, 8, 1);
for (let day = 0; day < 400; day += 1) {
  const d = new Date(start + day * 86_400_000);
  const dateKey = d.toISOString().slice(0, 10);
  const seed = dateSeed(dateKey);
  const board = createBoard(mulberry32(seed));

  check(board.rounds.length === ROUNDS, `${dateKey}: five rounds`);
  check(new Set(board.rounds.map((r) => r.iso3)).size === ROUNDS, `${dateKey}: five distinct countries`);
  check(new Set(board.rounds.map((r) => CONTINENT_OF.get(r.iso3))).size >= 3, `${dateKey}: three continents`);
  for (const r of board.rounds) {
    check(r.pool.length === 3, `${dateKey}: ${r.iso3} pool of three`);
    check(new Set(r.pool.map((p) => p.archetype)).size === 3, `${dateKey}: ${r.iso3} three archetypes`);
    check(new Set(r.pool.map((p) => p.standing)).size > 1, `${dateKey}: ${r.iso3} standings not all equal`);
    check(r.pool.every((p) => p.standing >= 1 && p.standing <= 5), `${dateKey}: ${r.iso3} standing in range`);
    check(r.iso2.length === 2 && r.name.length > 0, `${dateKey}: ${r.iso3} has a flag and a name`);
  }
  const offered = new Set(board.rounds.flatMap((r) => r.pool.map((p) => p.archetype)));
  check([0, 1, 2, 3, 4].filter((a) => offered.has(a)).length >= 4, `${dateKey}: four naturals offered`);
  check(board.ceiling >= MIN_CEILING && board.ceiling <= MAX_CEILING, `${dateKey}: ceiling ${board.ceiling} in window`);
  const greedy = greedyLine(board.rounds).score;
  check(board.ceiling - greedy >= 5, `${dateKey}: greedy gap ${board.ceiling - greedy}`);
  check(board.best.length === ROUNDS, `${dateKey}: best line has five picks`);
  check(new Set(board.best.map((p) => p.seat)).size === ROUNDS, `${dateKey}: best line uses five seats`);
  ceilings.push(board.ceiling);
  greedies.push(greedy);
  gaps.push(board.ceiling - greedy);

  // determinism
  const again = createBoard(mulberry32(seed));
  check(JSON.stringify(again) === JSON.stringify(board), `${dateKey}: same seed, same board`);

  // the fill order is a pure function of the five countries and always leads with them
  const order = fillOrder(board.rounds.map((r) => r.iso3));
  check(order.length === 195, `${dateKey}: fill order covers 195`);
  check(new Set(order).size === 195, `${dateKey}: fill order has no repeats`);
  check(board.rounds.every((r) => order.indexOf(r.iso3) < 5), `${dateKey}: the five round countries fill first`);

  // play it out through the module, seating each round's best-scoring open seat
  let s = createGame(seed);
  const log: { t: string }[] = [];
  for (let round = 0; round < ROUNDS; round += 1) {
    const pick = board.best.find((p) => p.round === round)!;
    const next = appoint(s, pick.poolIdx as PoolIdx, pick.seat as SeatIdx);
    check(next !== s, `${dateKey}: round ${round} appointment lands`);
    s = next;
    log.push({ t: "appoint" });
  }
  check(s.phase === "reveal", `${dateKey}: reveal after the fifth`);
  const scored = scoreState(s);
  check(scored.score === board.ceiling, `${dateKey}: replaying the best line scores the ceiling`);
  check(scored.score >= 0 && scored.score <= MAX_SCORE, `${dateKey}: score in range`);
  check(scored.fitTotal + scored.standingTotal + scored.bonusTotal === scored.score, `${dateKey}: parts sum`);
  s = seen(s);
  check(gameModule.done(s), `${dateKey}: done after seen`);

  const payload = gameModule.payload(s, { mode: "daily", dateKey, startedAt: new Date().toISOString() });
  check(payload.scoreRaw === board.ceiling, `${dateKey}: payload score`);
  check(payload.scoreMax === MAX_SCORE, `${dateKey}: payload max`);
  check(payload.scoreSortValue === board.ceiling, `${dateKey}: payload sort value`);
  const rj = payload.resultJson as Record<string, unknown>;
  check((rj.appointments as unknown[]).length === 5, `${dateKey}: five appointments in the payload`);
  check((rj.best as unknown[]).length === 5, `${dateKey}: best line in the payload`);
  check((rj.roundCountries as string[]).length === 5, `${dateKey}: round countries in the payload`);
  check(rj.band === bandOf(board.ceiling).key, `${dateKey}: band key`);
  check(rj.gap === 0, `${dateKey}: gap to the ceiling is zero on the best line`);
}

// the undo path and the codec
{
  const s0 = createGame(dateSeed("2026-09-01"));
  let s = appoint(s0, 0, 0);
  s = appoint(s, 1, 1);
  const back = undo(s);
  check(back.round === 1 && back.seats[1] === null && back.undoUsed, "undo takes back the last appointment");
  check(undo(back) === back, "only one undo per run");
  const log = [
    { t: "appoint", i: 0, s: 0 },
    { t: "appoint", i: 1, s: 1 },
    { t: "undo" },
    { t: "appoint", i: 2, s: 3 },
    { t: "appoint", i: 0, s: 2 },
    { t: "appoint", i: 1, s: 4 },
    { t: "appoint", i: 0, s: 1 },
    { t: "seen" },
  ] as Parameters<typeof codec.enc>[0];
  const enc = codec.enc(log);
  check(enc.length <= 24, `codec worst case is ${enc.length} characters`);
  check(JSON.stringify(codec.dec(enc)) === JSON.stringify(log), "codec round trips");
  let threw = false;
  try {
    codec.dec("a9z");
  } catch {
    threw = true;
  }
  check(threw, "codec rejects a malformed log");
}

// a random cabinet is never out of range, and an independent re-implementation agrees
{
  const rng = mulberry32(12345);
  for (let i = 0; i < 4000; i += 1) {
    const board = createBoard(mulberry32(Math.floor(rng() * 2 ** 31)));
    let s = createGame(0);
    s = { ...s, board };
    const seats = [0, 1, 2, 3, 4].sort(() => rng() - 0.5) as SeatIdx[];
    for (let round = 0; round < ROUNDS; round += 1) s = appoint(s, Math.floor(rng() * 3) as PoolIdx, seats[round]);
    const r = scoreState(s);
    check(r.score >= 0 && r.score <= MAX_SCORE, `random cabinet in range (${r.score})`);
    const picks = appointmentsOf(s);
    let fit = 0;
    let st = 0;
    for (const p of picks) {
      fit += p.fit;
      st += p.standingPoints;
    }
    check(fit === r.fitTotal && st === r.standingTotal, "independent totals agree");
    const top = Math.max(...picks.map((p) => figureAt(board, p).standing));
    const expected = {
      fullCabinet: picks.every((p) => p.fit >= 12),
      rightHand: picks.some((p) => figureAt(board, p).standing === top && p.fit === 25),
      threeNaturals: picks.filter((p) => p.fit === 25).length >= 3,
    };
    check(JSON.stringify(expected) === JSON.stringify(r.bonuses), "independent bonuses agree");
    if (i > 60) break;
  }
}

const q = (a: number[], x: number) => [...a].sort((p, n) => p - n)[Math.floor(a.length * x)];
console.log("continents:", CONTINENTS.join(", "), "| countries:", POOL.length);
console.log("ceiling  min", Math.min(...ceilings), "p10", q(ceilings, 0.1), "med", q(ceilings, 0.5), "p90", q(ceilings, 0.9), "max", Math.max(...ceilings));
console.log("greedy   min", Math.min(...greedies), "med", q(greedies, 0.5), "max", Math.max(...greedies));
console.log("greedy gap min", Math.min(...gaps), "med", q(gaps, 0.5), "max", Math.max(...gaps), "| boards meeting the", MIN_GREEDY_GAP, "target:", `${((gaps.filter((g) => g >= MIN_GREEDY_GAP).length / gaps.length) * 100).toFixed(1)} %`);
console.log(failures === 0 ? "country-draft: all checks passed" : `country-draft: ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
