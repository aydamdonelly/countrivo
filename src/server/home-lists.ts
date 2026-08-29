import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/ui/types";

/** One row of `user_game_stats`, reduced to what a practice meta needs (blueprint 10.4). */
export interface PracticeMeta {
  /** total_runs */
  runs: number;
  bestRaw: number;
  bestMax: number;
  /** `22`, `7/10`, `1 280`: the compact best for `27 played · best 22`. */
  best: string;
}

/** Games whose score reads as a count of a total (`7/10`, `4/6`, `3/4`). */
const COUNT_OF_TOTAL = new Set(["flag-quiz", "geo-wordle"]);

function group(n: number): string {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

/** The compact best label per game family. */
export function bestLabel(slug: string, raw: number, max: number): string {
  if (COUNT_OF_TOTAL.has(slug) && max > 0) return `${group(raw)}/${group(max)}`;
  return group(raw);
}

type StatsRow = {
  game_slug: string;
  total_runs: number | null;
  best_score_raw: number | null;
  best_score_max: number | null;
};

/**
 * The practice metas of the signed-in viewer (blueprint 9.1 step 8): one `user_game_stats`
 * select by user (at most seven rows). Guests get an empty map and the registry descriptions.
 */
export const getPracticeMetas = cache(async (viewer: Viewer): Promise<Record<string, PracticeMeta>> => {
  if (!viewer.user) return {};
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_game_stats")
      .select("game_slug, total_runs, best_score_raw, best_score_max")
      .eq("user_id", viewer.user.id);
    const out: Record<string, PracticeMeta> = {};
    for (const row of (data ?? []) as StatsRow[]) {
      const runs = row.total_runs ?? 0;
      const bestRaw = Number(row.best_score_raw ?? 0);
      const bestMax = Number(row.best_score_max ?? 0);
      out[row.game_slug] = { runs, bestRaw, bestMax, best: bestLabel(row.game_slug, bestRaw, bestMax) };
    }
    return out;
  } catch (err) {
    console.error("[home-lists] practice metas failed", err);
    return {};
  }
});
