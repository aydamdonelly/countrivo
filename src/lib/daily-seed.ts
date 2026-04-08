import { mulberry32 } from "./seeded-random";

export function dateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDailyRng(dateKey: string): () => number {
  return mulberry32(dateSeed(dateKey));
}

/** Returns YYYY-MM-DD in Europe/Berlin timezone — the global Countrivo "today". */
export function getTodayDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

/** Format ms until reset as human-readable string (e.g. "3h 42m"). */
export function formatTimeUntilReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Milliseconds until next daily reset (00:00 Europe/Berlin). */
export function msUntilReset(): number {
  const now = new Date();
  // Current time in Europe/Berlin
  const berlinNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  // Next midnight in Berlin
  const berlinMidnight = new Date(berlinNow);
  berlinMidnight.setDate(berlinMidnight.getDate() + 1);
  berlinMidnight.setHours(0, 0, 0, 0);
  // Difference in ms (using the offset between the two representations)
  const diff = berlinMidnight.getTime() - berlinNow.getTime();
  return Math.max(0, diff);
}
