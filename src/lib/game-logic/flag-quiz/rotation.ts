/*
 * Stateless rotation windows for the daily Flag Quiz (concept 5.4: no answer flag within
 * 21 days, no lookalike set within 3 days).
 *
 * There is no `daily_boards` table to remember what ran, so the schedule is a pure function
 * of the day. Each pool is laid out as an endless stream of slots, `perDay` slots a day,
 * counted from EPOCH. The stream is cut into passes; every pass holds each item exactly once.
 * Pass 0 is a seeded shuffle; pass k+1 is a seeded shuffle of pass k under one constraint:
 * an item at position p in pass k may not sit before position p - slack in pass k+1, where
 * slack = size - perDay * gapDays. Two uses of an item are then always at least
 * perDay * gapDays slots apart, so at least `gapDays` days apart.
 *
 * The passes are rebuilt from pass 0 on every call. That is a few hundred tiny shuffles
 * even years after the epoch, well under a millisecond, and it keeps the board a function
 * of the date alone on the server and in the browser.
 */
import { mulberry32 } from "@/lib/seeded-random";

/** Day 0 of the schedule. Earlier dates clamp to it. */
const EPOCH_MS = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;

/** Whole days from EPOCH to an ISO `YYYY-MM-DD` key; null for anything else. */
export function dayIndex(dateKey: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const t = Date.parse(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((t - EPOCH_MS) / DAY_MS));
}

/** A 31-bit string hash (the same family as dateSeed), for per-pass shuffle seeds. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shuffle(n: number, rng: () => number): number[] {
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The next pass: every item lands at or after (its previous position - slack). The items
 * become eligible in their previous order, slack + 1 ahead of the position being filled, so
 * the eligible pool is never empty and the walk is linear.
 */
function nextPass(prev: readonly number[], slack: number, rng: () => number): number[] {
  const n = prev.length;
  const pool: number[] = [];
  let nextIn = 0;
  const out: number[] = [];
  for (let q = 0; q < n; q++) {
    while (nextIn < n && nextIn <= q + slack) pool.push(prev[nextIn++]);
    const k = Math.floor(rng() * pool.length);
    out.push(pool[k]);
    pool[k] = pool[pool.length - 1];
    pool.pop();
  }
  return out;
}

export interface RotationSpec {
  /** Salt that separates the pools' shuffles. */
  salt: string;
  size: number;
  perDay: number;
  /** Minimum days between two uses of one item. */
  gapDays: number;
}

/**
 * The item indices (0..size-1) a pool hands out on day `day`, in slot order. The
 * constraint needs size >= perDay * gapDays; a spec that cannot meet it throws.
 */
export function rotationFor(spec: RotationSpec, day: number): number[] {
  const { salt, size, perDay, gapDays } = spec;
  const slack = size - perDay * gapDays;
  if (slack < 0) throw new Error(`flag-quiz rotation ${salt}: ${size} items cannot hold a ${gapDays}-day gap at ${perDay} a day`);
  const first = day * perDay;
  const last = first + perDay - 1;
  const lastPass = Math.floor(last / size);
  let pass = shuffle(size, mulberry32(hash(`fq:${salt}:0`)));
  const passes = new Map<number, number[]>();
  passes.set(0, pass);
  for (let k = 1; k <= lastPass; k++) {
    pass = nextPass(pass, slack, mulberry32(hash(`fq:${salt}:${k}`)));
    if (k >= Math.floor(first / size)) passes.set(k, pass);
  }
  const out: number[] = [];
  for (let s = first; s <= last; s++) {
    const p = passes.get(Math.floor(s / size));
    if (!p) throw new Error("flag-quiz rotation: pass missing");
    out.push(p[s % size]);
  }
  return out;
}

/** How many times the pool has been walked through by the first slot of `day` (alternates lookalike answers). */
export function passOf(spec: Pick<RotationSpec, "size" | "perDay">, day: number, slotInDay: number): number {
  return Math.floor((day * spec.perDay + slotInDay) / spec.size);
}
