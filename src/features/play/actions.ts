"use server";

import { getTodayDateKey } from "@/lib/daily-seed";
import { dailyMetas, type DailyMeta } from "./server";

/** The public shot counts of every daily today (cached public boards, 30 s), for the NextDailies metas after a finish. */
export async function fetchDailyMetas(dateKey?: string): Promise<Record<string, DailyMeta>> {
  return dailyMetas(dateKey ?? getTodayDateKey());
}
