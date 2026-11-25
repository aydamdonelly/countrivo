/**
 * Blind Pick content gate: every statistic a board can draw is fit to play, and the daily
 * rotation keeps boards fresh without making them harder.
 *
 * Run: npx tsx scripts/check-blind-pick-data.ts
 *
 * 1. Data: each eligible statistic covers at least 185 sovereign states, ties at most 20% of
 *    its ranks, has no negative value (latitude excepted: south of the equator is negative),
 *    carries wording, definition and caption, has its Clay icon and is not withheld.
 * 2. Rotation: over 365 Berlin days from BLIND_PICK_ROTATION_FROM every board has the four
 *    anchors plus four distinct rotating statistics, each rotating statistic plays on half of
 *    all days and never more than two days in a row, the two days of a block share none, no
 *    separated pair meets, many distinct sets appear, and an edition reroll keeps the categories.
 * 3. Difficulty: the same 365 days dealt from the frozen V3 pool and from the rotation meet the
 *    greedy-gap window on every board, with comparable median gap and perfect score.
 * 4. Freeze: every board dated before the rotation is deep-equal to the V3 board for its seed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { categories } from '../src/lib/data/public';
import { mulberry32 } from '../src/lib/seeded-random';
import { sovereignCount, sovereignRank, SOVEREIGN_SET } from '../src/lib/game-logic/blind-pick/sovereign-ranks';
import { generateBlindPickConfig, MAX_GREEDY_GAP, MIN_GREEDY_GAP } from '../src/lib/game-logic/blind-pick/generator';
import { STAT_DEFINITIONS, STAT_WORDING, statLabel, statUnit } from '../src/lib/game-logic/blind-pick/display';
import {
  ANCHOR_STATS, BLIND_PICK_ROTATION_FROM, ROTATING_STATS, SEPARATE_PAIRS, V3_STATS,
  rotatingStatsForDate, rotationActive, rotationBlock,
} from '../src/lib/game-logic/blind-pick/rotation';
import type { BlindPickConfig } from '../src/lib/game-logic/blind-pick/types';

let checks = 0;
function check(ok: boolean, label: string): void { assert(ok, label); checks += 1; }

const MIN_COVERAGE = 185;
const MAX_TIED_SHARE = 0.2;
const SIGNED = new Set(['latitude']);
const stats: Record<string, Record<string, number | null>> = JSON.parse(readFileSync('src/data/stats.json', 'utf8'));
const published = new Set(categories.map((c) => c.slug));

// --- 1. data gate -------------------------------------------------------------------------
const eligible = [...new Set<string>([...V3_STATS, ...ANCHOR_STATS, ...ROTATING_STATS])];
for (const slug of eligible) {
  check(published.has(slug), `${slug} is a published, not withheld, category`);
  const count = sovereignCount(slug);
  check(count >= MIN_COVERAGE, `${slug} covers ${count} sovereign states, at least ${MIN_COVERAGE}`);
  const ranks = [...SOVEREIGN_SET].map((iso3) => sovereignRank(iso3, slug)).filter((r): r is number => r !== null);
  const tied = ranks.length - new Set(ranks).size;
  check(tied / ranks.length <= MAX_TIED_SHARE, `${slug} ties ${tied} of ${ranks.length} ranks, at most ${MAX_TIED_SHARE * 100}%`);
  if (!SIGNED.has(slug)) {
    check([...SOVEREIGN_SET].every((iso3) => (stats[iso3]?.[slug] ?? 0) >= 0), `${slug} has no negative values`);
  }
  check(Boolean(STAT_WORDING[slug]) && Boolean(STAT_DEFINITIONS[slug]) && statLabel(slug) !== slug && statUnit(slug) !== '', `${slug} has wording, definition and caption`);
  check(!/best|worst/i.test(`${STAT_WORDING[slug]} ${STAT_DEFINITIONS[slug]}`), `${slug} wording never says best or worst`);
  for (const frame of ['rest.webp', 'rest.256.webp', 'rest.128.webp']) {
    check(existsSync(`public/clay/stat-${slug}/${frame}`), `${slug} has its Clay icon ${frame}`);
  }
}
check(ANCHOR_STATS.every((s) => !(ROTATING_STATS as readonly string[]).includes(s)), 'Anchors and rotating statistics are disjoint');
check(ANCHOR_STATS.length + ROTATING_STATS.length / 2 === 8, 'Four anchors plus half the deck fill eight slots');
check(new Set(ROTATING_STATS).size === 8, 'The rotating deck holds eight distinct statistics');
check(V3_STATS.length === 9, 'The frozen V3 pool keeps its nine statistics');

// --- 2. rotation over a year --------------------------------------------------------------
function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const DAYS = 365;
const dates = Array.from({ length: DAYS }, (_, i) => addDays(BLIND_PICK_ROTATION_FROM, i));
check(!rotationActive(addDays(BLIND_PICK_ROTATION_FROM, -1)) && rotationActive(BLIND_PICK_ROTATION_FROM), 'Rotation starts exactly on its Berlin date');
check(rotatingStatsForDate('2026-11-26') === null && rotatingStatsForDate('not-a-date') === null, 'Earlier and malformed dates have no rotation');

const plays = new Map<string, number>();
const streak = new Map<string, number>();
const longest = new Map<string, number>();
const sets = new Set<string>();
let previous: readonly string[] = [];
for (const [i, dateKey] of dates.entries()) {
  const today = rotatingStatsForDate(dateKey);
  assert(today);
  check(today.length === 4 && new Set(today).size === 4, `${dateKey} draws four distinct rotating statistics`);
  for (const [x, y] of SEPARATE_PAIRS) check(!(today.includes(x) && today.includes(y)), `${dateKey} keeps ${x} and ${y} apart`);
  if (i % 2 === 1) check(previous.every((s) => !today.includes(s as (typeof ROTATING_STATS)[number])), `${dateKey} shares no rotating statistic with the first day of its block`);
  for (const s of ROTATING_STATS) {
    const on = today.includes(s);
    if (on) plays.set(s, (plays.get(s) ?? 0) + 1);
    streak.set(s, on ? (streak.get(s) ?? 0) + 1 : 0);
    longest.set(s, Math.max(longest.get(s) ?? 0, streak.get(s) ?? 0));
  }
  sets.add([...today].sort().join(','));
  previous = today;
}
for (const s of ROTATING_STATS) {
  const share = (plays.get(s) ?? 0) / DAYS;
  check(share >= 0.4 && share <= 0.6, `${s} plays on ${(share * 100).toFixed(1)}% of days, 40 to 60%`);
  check((longest.get(s) ?? 0) <= 2, `${s} never plays more than two days in a row`);
}
check(sets.size >= 20, `${sets.size} distinct rotating sets in a year, against 9 possible boards before`);
check(JSON.stringify(rotationBlock(3)) === JSON.stringify(rotationBlock(3)), 'A block is a pure function of its number');

// --- 3. difficulty: V3 against the rotation on the same days and seeds ---------------------
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function deal(pool: 'v3' | 'rotation', mode: 'daily' | 'practice'): BlindPickConfig[] {
  return dates.map((dateKey, i) => generateBlindPickConfig(mulberry32(1000 + i * 7919), mode, dateKey, 8, pool));
}
const seen = new Set<string>();
const summary: Record<string, { gap: number; perfect: number }> = {};
for (const [name, pool, mode] of [['v3 daily', 'v3', 'daily'], ['rotation daily', 'rotation', 'daily'], ['rotation practice', 'rotation', 'practice']] as const) {
  const boards = deal(pool, mode);
  const gaps = boards.map((c) => c.greedyScore - c.optimalScore);
  check(gaps.every((g) => g >= MIN_GREEDY_GAP && g <= MAX_GREEDY_GAP), `${name}: every board meets the greedy-gap window`);
  check(boards.every((c) => new Set(c.categories.map((x) => x.slug)).size === 8 && new Set(c.countries.map((x) => x.iso3)).size === 8), `${name}: eight distinct statistics and countries per board`);
  if (pool === 'rotation') {
    check(boards.every((c) => ANCHOR_STATS.every((a) => c.categories.some((x) => x.slug === a))), `${name}: the four anchors sit on every board`);
    check(boards.every((c) => SEPARATE_PAIRS.every(([x, y]) => !(c.categories.some((k) => k.slug === x) && c.categories.some((k) => k.slug === y)))), `${name}: separated pairs never share a board`);
    for (const c of boards) for (const x of c.categories) seen.add(x.slug);
  }
  if (mode === 'daily' && pool === 'rotation') {
    check(boards.every((c, i) => {
      const expected = [...ANCHOR_STATS, ...(rotatingStatsForDate(dates[i]) ?? [])].sort().join(',');
      return c.categories.map((x) => x.slug).sort().join(',') === expected;
    }), `${name}: the categories depend on the date alone`);
  }
  summary[name] = { gap: median(gaps), perfect: median(boards.map((c) => c.optimalScore)) };
  check(summary[name].gap >= 14 && summary[name].gap <= 18, `${name}: median greedy gap ${summary[name].gap} lies in 14 to 18`);
}
check([...ROTATING_STATS, ...ANCHOR_STATS].every((s) => seen.has(s)), 'Every category of the rotation appears on a dealt board');
const base = summary['v3 daily'].perfect;
for (const name of ['rotation daily', 'rotation practice']) {
  const drift = Math.abs(summary[name].perfect - base) / base;
  check(drift <= 0.1, `${name}: median perfect score ${summary[name].perfect} within 10% of the V3 median ${base}`);
}
const reroll = generateBlindPickConfig(mulberry32(424242), 'daily', dates[10]);
const original = generateBlindPickConfig(mulberry32(1000 + 10 * 7919), 'daily', dates[10]);
check(reroll.categories.map((c) => c.slug).sort().join() === original.categories.map((c) => c.slug).sort().join(), 'An edition reroll keeps the day’s categories');

// --- 4. freeze before the rotation --------------------------------------------------------
for (const dateKey of ['2026-11-24', '2026-11-25', '2026-11-26']) {
  for (const mode of ['daily', 'practice'] as const) {
    for (let seed = 1; seed <= 25; seed += 1) {
      assert.deepEqual(generateBlindPickConfig(mulberry32(seed), mode, dateKey), generateBlindPickConfig(mulberry32(seed), mode, dateKey, 8, 'v3'), `${dateKey} ${mode} seed ${seed} keeps the V3 board`);
      checks += 1;
    }
  }
}

console.log(`Blind Pick data and rotation: ${checks} checks passed. ${eligible.length} statistics, ${sets.size} rotating sets a year.`);
for (const [name, s] of Object.entries(summary)) console.log(`  ${name}: median gap ${s.gap}, median perfect ${s.perfect}`);
