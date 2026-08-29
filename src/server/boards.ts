import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { getTodayDateKey } from "@/lib/daily-seed";
import { toFlagCode } from "@/lib/silhouettes";
import type { BoardRow, GameBoard } from "@/app/actions/home";

export type RunRow = {
  user_id: string;
  game_slug: string;
  score_display: string | null;
  score_raw: number | null;
  score_sort_value: number | string | null;
};
export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  country_code: string | null;
  streak_current: number | null;
};

/** The tag of the cached landing boards. */
export const BOARDS_TAG = "boards";

const QUERY_TIMEOUT_MS = 6000;

function anonClient() {
  return createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * "Score: 635 (Gap: 424)" and "Streak: 7" become "635" and "7": boards want the number, the
 * result panel keeps the sentence. Short displays ("7 / 10", "4/6", "1280 pts") pass through.
 */
export function compactScore(display: string | null | undefined, raw: unknown): string {
  const d = (display ?? "").trim();
  const m = d.match(/^(?:Score|Streak):\s*([^\s(]+)/i);
  if (m) return m[1];
  if (d.length > 0 && d.length <= 10) return d;
  return raw != null ? String(raw) : d;
}

/**
 * Today's daily runs plus the profiles behind them. Public data (RLS lets anyone read
 * daily runs), fetched with the anon key, cached for 30 s and shared by every visitor.
 * Every query carries a timeout, so one slow round trip degrades to "no shots yet"
 * instead of stalling the page. Moved here from src/app/actions/home.ts unchanged
 * (blueprint 9.1 step 5); getHomeData keeps its exact return shape.
 */
export const getPublicBoards = unstable_cache(
  async (dateKey: string, dailySlugs: string[]) => {
    const anon = anonClient();
    let runs: RunRow[] = [];
    let profiles: ProfileRow[] = [];
    let edition = "";
    try {
      const [r, e] = await Promise.all([
        anon
          .from("game_runs")
          .select("user_id, game_slug, score_display, score_raw, score_sort_value")
          .eq("daily_date", dateKey)
          .eq("mode", "daily")
          .in("game_slug", dailySlugs)
          .limit(5000)
          .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS)),
        anon.from("app_config").select("value").eq("key", "daily_edition").abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS)).maybeSingle(),
      ]);
      runs = (r.data ?? []) as RunRow[];
      edition = (e.data?.value as string | undefined) ?? "";
      const ids = [...new Set(runs.map((x) => x.user_id))];
      if (ids.length) {
        const p = await anon.from("profiles").select("id, username, display_name, country_code, streak_current").in("id", ids).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
        profiles = (p.data ?? []) as ProfileRow[];
      }
    } catch (err) {
      console.error("[home] public boards failed", err);
    }
    return { runs, profiles, edition };
  },
  ["home-public-boards"],
  { revalidate: 30 },
);

/** A landing's public board: the top 3 plus the distinct countries among the day's runs. */
export type PublicBoard = GameBoard & { countries: number };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const readPublicBoard = unstable_cache(
  async (dateKey: string, slug: string): Promise<PublicBoard> => {
    const anon = anonClient();
    let runs: RunRow[] = [];
    const profiles: ProfileRow[] = [];
    try {
      const r = await anon
        .from("game_runs")
        .select("user_id, game_slug, score_display, score_raw, score_sort_value")
        .eq("daily_date", dateKey)
        .eq("mode", "daily")
        .eq("game_slug", slug)
        .order("score_sort_value", { ascending: false })
        .limit(5000)
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
      runs = (r.data ?? []) as RunRow[];
      const ids = [...new Set(runs.map((x) => x.user_id))];
      for (const part of chunk(ids, 500)) {
        const p = await anon.from("profiles").select("id, username, display_name, country_code, streak_current").in("id", part).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
        profiles.push(...((p.data ?? []) as ProfileRow[]));
      }
    } catch (err) {
      console.error("[boards] public board failed", slug, err);
    }
    const profile = new Map(profiles.map((p) => [p.id, p]));
    const rows: BoardRow[] = runs
      .slice()
      .sort((a, b) => Number(b.score_sort_value) - Number(a.score_sort_value))
      .map((r, i) => {
        const p = profile.get(r.user_id);
        return {
          userId: r.user_id,
          name: p?.display_name || p?.username || "player",
          flag: toFlagCode(p?.country_code),
          crest: null,
          score: compactScore(r.score_display, r.score_raw),
          sort: Number(r.score_sort_value),
          rank: i + 1,
          isMe: false,
        };
      });
    const countries = new Set(rows.map((r) => r.flag).filter((f): f is string => f !== null)).size;
    return {
      slug,
      shots: rows.length,
      top: rows[0]?.score ?? null,
      global: rows.slice(0, 3),
      me: null,
      friends: [],
      countries,
    };
  },
  ["public-board"],
  { revalidate: 60, tags: [BOARDS_TAG] },
);

/**
 * The public top 3 of one game for a static landing (blueprint 7.3 step 4, 9.1 step 5):
 * anon client, cached 60 s per (dateKey, slug) under the `boards` tag. Nothing here is
 * viewer-specific, so the page stays static (ISR).
 */
export async function getPublicBoard(slug: string, dateKey: string = getTodayDateKey()): Promise<PublicBoard> {
  return readPublicBoard(dateKey, slug);
}
