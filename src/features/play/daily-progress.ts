import type { DailyRef, HostProps } from "@/games/types";
import { buildDayShareText } from "@/lib/share";

export interface DailyProgress {
  /** The first daily in table order this device has not finished yet. */
  next?: DailyRef;
  /** Finished dailies today, counting the one just played. */
  done: number;
  total: number;
  /** Set once every daily is finished: the text for "Share your day". */
  dayShare?: string;
  /** Today's Berlin board date. */
  dateKey: string;
}

/** Where the viewer stands in today's set right after finishing `slug`. */
export function dailyProgress(p: Pick<HostProps, "dailies" | "shotToday" | "dayScores" | "dateKey">, slug: string, score: string | undefined): DailyProgress {
  const finished = new Set([...p.shotToday, slug]);
  const next = p.dailies.find((daily) => !finished.has(daily.slug));
  const scores: Record<string, string> = { ...p.dayScores, ...(score ? { [slug]: score } : {}) };
  const dayShare = next ? undefined : buildDayShareText(p.dateKey, p.dailies.flatMap((daily) => scores[daily.slug] ? [{ title: daily.title, score: scores[daily.slug] }] : []));
  return { next, done: p.dailies.filter((daily) => finished.has(daily.slug)).length, total: p.dailies.length, dayShare, dateKey: p.dateKey };
}
