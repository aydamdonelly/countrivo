"use client";

import { DONE_COOKIE, encodeDone, encodeProgress, mergeDone, progressCookieName, progressWithinBudget, readDone, type CookieReader } from "@/server/progress";
import { setDailyLockout } from "@/lib/storage";

/*
 * The cookies the host writes (blueprint 8.6), through document.cookie. The encoders and the
 * readers are the pure helpers of src/server/progress.ts, so the page and the host agree
 * byte for byte. Practice runs write nothing.
 */

/** document.cookie as the CookieReader the server helpers take. */
export function documentCookies(): CookieReader {
  return {
    get(name: string) {
      if (typeof document === "undefined") return undefined;
      for (const part of document.cookie.split("; ")) {
        const eq = part.indexOf("=");
        if (eq < 0) continue;
        if (part.slice(0, eq) === name) return { value: part.slice(eq + 1) };
      }
      return undefined;
    },
  };
}

function write(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}; SameSite=Lax`;
}

/** Seconds until the next Berlin midnight, from the server clock plus the time elapsed here. */
export function secondsUntilReset(resetAt: number, serverNow: number, clientNowAtMount: number): number {
  const now = Date.now() + (serverNow - clientNowAtMount);
  return Math.max(60, Math.ceil((resetAt - now) / 1000));
}

export interface ProgressWrite {
  slug: string;
  dateKey: string;
  edition: string;
  startedAtMs: number;
  log: string;
  maxAge: number;
}

/**
 * Writes cv_p_{slug}. Returns false (and writes nothing) when the value would exceed the
 * 900-byte cap; the host then stops persisting further actions (never truncates mid-token).
 */
export function writeProgress(p: ProgressWrite): boolean {
  const value = encodeProgress({ dateKey: p.dateKey, edition: p.edition, startedAt: p.startedAtMs, log: p.log });
  if (!progressWithinBudget(value)) return false;
  write(progressCookieName(p.slug), value, p.maxAge);
  return true;
}

export function clearProgress(slug: string): void {
  write(progressCookieName(slug), "", 0);
}

/** Rewrites cv_done with this game's score added (about 20 bytes per game). */
export function writeDone(dateKey: string, edition: string, slug: string, scoreLabel: string, maxAge: number): void {
  const existing = readDone(documentCookies(), dateKey, edition);
  write(DONE_COOKIE, encodeDone(mergeDone(existing, dateKey, edition, slug, scoreLabel)), maxAge);
}

/** The localStorage belt a rollback to the previous build would read; nothing in the new tree does. */
export function writeLockoutBelt(slug: string, dateKey: string, edition: string, scoreRaw: number, scoreDisplay: string): void {
  setDailyLockout(slug, dateKey, { score: String(scoreRaw), scoreDisplay, timestamp: Date.now() }, edition);
}
