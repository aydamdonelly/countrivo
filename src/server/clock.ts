import { cache } from "react";
import { getTodayDateKey, msUntilReset } from "@/lib/daily-seed";
import type { Clock } from "@/ui/types";

/**
 * The server clock (blueprint 9.1 step 4): one snapshot per request. Countdowns are seeded
 * from `resetAt` and `now`, so the first client render prints the same string the server
 * did; no client-side date math happens on the first render anywhere.
 */
export const getClock = cache(async (): Promise<Clock> => {
  const now = Date.now();
  return { now, dateKey: getTodayDateKey(), resetAt: now + msUntilReset() };
});

/**
 * `17 h 37 m`; under one hour `41 m`; under one minute `now`. The same arithmetic as the
 * Countdown primitive's formatCountdown, so a server-rendered line and the ticking client
 * line never disagree.
 */
export function formatReset(ms: number): string {
  if (ms < 60_000) return "now";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m} m` : `${h} h ${m} m`;
}
