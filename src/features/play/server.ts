import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAllGames } from "@/lib/data/games";
import { anonymousLeaderboard } from "@/server/anonymous-runs";
import type { DailyRef } from "@/games/types";
import type { GameSlug } from "@/ui/types";

/** `41 shots · top 635` per daily, from the cached public boards (public data, 30 s). */
export interface DailyMeta {
  shots: number;
  top: string | null;
}

/** The shot count and top score of every daily today, keyed by slug. */
export async function dailyMetas(dateKey: string): Promise<Record<string, DailyMeta>> {
  const dailySlugs = getAllGames()
    .filter((g) => g.availableModes.includes("daily"))
    .map((g) => g.slug);
  const out: Record<string, DailyMeta> = {};
  await Promise.all(dailySlugs.map(async (slug) => {
    const rows = await anonymousLeaderboard(slug, dateKey);
    out[slug] = { shots: rows.length, top: rows[0]?.scoreDisplay ?? null };
  }));
  return out;
}

/*
 * Server helpers of the play route that P1's src/server does not cover: the friends who
 * shot one game today (for `#2 of 5 friends`) and the NextDailies rows. Server only.
 */

export interface FriendsToday {
  friendCount: number;
  /** score_sort_value of each friend who shot this game today (the viewer excluded). */
  scores: number[];
}

/** Two queries on the server client, no extra auth call: accepted friendships, then their runs today. */
export const getFriendsToday = cache(async (userId: string, slug: string, dateKey: string): Promise<FriendsToday> => {
  try {
    const supabase = await createClient();
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    const friendIds = (friendships ?? []).map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id) as string);
    if (friendIds.length === 0) return { friendCount: 0, scores: [] };
    const { data: runs } = await supabase
      .from("game_runs")
      .select("user_id, score_sort_value")
      .in("user_id", friendIds)
      .eq("game_slug", slug)
      .eq("daily_date", dateKey)
      .eq("mode", "daily");
    return { friendCount: friendIds.length, scores: (runs ?? []).map((r) => Number(r.score_sort_value ?? 0)) };
  } catch (err) {
    console.error("[play] friends today failed", slug, err);
    return { friendCount: 0, scores: [] };
  }
});

/** The dailies in registry order, Country Draft first (it is the flagship and first in the registry). */
export function dailyRefs(): DailyRef[] {
  return getAllGames()
    .filter((g) => g.availableModes.includes("daily"))
    .map((g) => ({ slug: g.slug as GameSlug, title: g.title }));
}

/** The `41 shots · top 635` / `no shots yet` meta of a NextDailies row (blueprint 10.4). */
export function nextDailyMeta(meta: DailyMeta | undefined): string {
  if (!meta || meta.shots === 0) return "Be the first today";
  return `${meta.shots} ${meta.shots === 1 ? "player" : "players"}${meta.top ? ` · top ${meta.top}` : ""}`;
}
