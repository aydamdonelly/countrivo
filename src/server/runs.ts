import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ServerGameRun } from "@/types/server";

const RUN_COLUMNS =
  "id, game_slug, mode, daily_date, score_raw, score_max, score_display, score_sort_value, score_normalized, rank_daily, percentile, is_personal_best, result_json, completed_at";

/** The same mapping as the `checkDailyStatus` action's, inlined so no action round trip is needed. */
export function mapRunRow(row: Record<string, unknown>): ServerGameRun {
  return {
    id: row.id as number,
    gameSlug: row.game_slug as string,
    mode: row.mode as string,
    dailyDate: (row.daily_date as string | null) ?? null,
    scoreRaw: Number(row.score_raw ?? 0),
    scoreMax: Number(row.score_max ?? 0),
    scoreDisplay: (row.score_display as string | null) ?? "",
    scoreSortValue: Number(row.score_sort_value ?? 0),
    scoreNormalized: Number(row.score_normalized ?? 0),
    rankDaily: (row.rank_daily as number | null) ?? null,
    percentile: row.percentile != null ? Number(row.percentile) : null,
    isPersonalBest: Boolean(row.is_personal_best),
    resultJson: (row.result_json as Record<string, unknown> | null) ?? {},
    completedAt: row.completed_at as string,
  };
}

/**
 * The viewer's daily run of one game today (blueprint 9.1 step 6): the `checkDailyStatus`
 * query without the action round trip. One select on the server client (RLS as the user).
 */
export const getTodayRun = cache(async (userId: string, slug: string, dateKey: string): Promise<ServerGameRun | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("game_runs")
      .select(RUN_COLUMNS)
      .eq("user_id", userId)
      .eq("game_slug", slug)
      .eq("daily_date", dateKey)
      .eq("mode", "daily")
      .maybeSingle();
    return data ? mapRunRow(data as Record<string, unknown>) : null;
  } catch (err) {
    console.error("[runs] today run failed", slug, err);
    return null;
  }
});

/** Every daily run of the viewer today, for the home card, NextDailies and the profile. */
export const getTodayRuns = cache(async (userId: string, dateKey: string): Promise<ServerGameRun[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("game_runs")
      .select(RUN_COLUMNS)
      .eq("user_id", userId)
      .eq("daily_date", dateKey)
      .eq("mode", "daily")
      .order("game_slug");
    return ((data ?? []) as Record<string, unknown>[]).map(mapRunRow);
  } catch (err) {
    console.error("[runs] today runs failed", err);
    return [];
  }
});
