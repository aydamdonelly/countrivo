"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey, getDailyRng } from "@/lib/daily-seed";
import { getAllGames } from "@/lib/data/games";
import { getSilhouettePath, iso2ToIso3, toFlagCode } from "@/lib/silhouettes";
import { generateDraftConfig } from "@/lib/game-logic/country-draft/generator";
import { compactScore, getPublicBoards, type ProfileRow, type RunRow } from "@/server/boards";

export interface BoardRow {
  userId: string;
  name: string;
  /** ISO2 for the flag in the global board (real origin). */
  flag: string | null;
  /** Crest path for the friends board (chosen country outline). */
  crest: string | null;
  score: string;
  sort: number;
  rank: number;
  isMe: boolean;
}

export interface FriendRow {
  userId: string;
  name: string;
  crest: string | null;
  score: string | null;
  sort: number | null;
  isMe: boolean;
}

export interface GameBoard {
  slug: string;
  shots: number;
  top: string | null;
  global: BoardRow[];
  me: { rank: number; score: string } | null;
  friends: FriendRow[];
}

export interface HomeData {
  dateKey: string;
  signedIn: boolean;
  meName: string | null;
  meCrest: string | null;
  streak: number | null;
  friendCount: number;
  boards: Record<string, GameBoard>;
  draftCategories: string[];
}

const QUERY_TIMEOUT_MS = 6000;

function crestFor(countryCode: string | null | undefined): string | null {
  return getSilhouettePath(iso2ToIso3(countryCode));
}

/**
 * Everything the home page needs: the cached public boards, plus (signed in)
 * the viewer's own profile and accepted friendships.
 */
export async function getHomeData(): Promise<HomeData> {
  const t0 = Date.now();
  const lap = (l: string) => { if (process.env.HOME_TIMING) console.log(`[home] ${l} ${Date.now() - t0}ms`); };
  const dateKey = getTodayDateKey();
  const dailySlugs = getAllGames().filter((g) => g.availableModes.includes("daily")).map((g) => g.slug);

  const supabase = await createClient();
  const [{ data: { user } }, pub] = await Promise.all([
    supabase.auth.getUser(),
    getPublicBoards(dateKey, dailySlugs),
  ]);
  lap("auth+public");
  const edition = pub.edition;
  // The public boards are cached for 30 s; the viewer's own shots must show up at once,
  // so they are read per request and merged over the cached rows.
  let runs: RunRow[] = pub.runs;
  if (user) {
    try {
      const { data: own } = await supabase
        .from("game_runs")
        .select("user_id, game_slug, score_display, score_raw, score_sort_value")
        .eq("user_id", user.id)
        .eq("daily_date", dateKey)
        .eq("mode", "daily")
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
      if (own && own.length) {
        const ownSlugs = new Set(own.map((r) => r.game_slug));
        runs = [...pub.runs.filter((r) => !(r.user_id === user.id && ownSlugs.has(r.game_slug))), ...(own as RunRow[])];
      }
    } catch (err) {
      console.error("[home] own runs failed", err);
    }
  }

  let friendIds: string[] = [];
  const extraProfiles: ProfileRow[] = [];
  if (user) {
    try {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
      friendIds = (friendships ?? []).map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
      const known = new Set(pub.profiles.map((p) => p.id));
      const missing = [user.id, ...friendIds].filter((id) => !known.has(id));
      if (missing.length) {
        const { data } = await supabase.from("profiles").select("id, username, display_name, country_code, streak_current").in("id", missing).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
        extraProfiles.push(...((data ?? []) as ProfileRow[]));
      }
    } catch (err) {
      console.error("[home] viewer data failed", err);
    }
  }
  lap("viewer");

  const profile = new Map<string, ProfileRow>([...pub.profiles, ...extraProfiles].map((p) => [p.id, p]));
  const nameOf = (id: string) => profile.get(id)?.display_name || profile.get(id)?.username || "player";

  const boards: Record<string, GameBoard> = {};
  for (const slug of dailySlugs) {
    const rs = runs
      .filter((r) => r.game_slug === slug)
      .sort((a, b) => Number(b.score_sort_value) - Number(a.score_sort_value));
    const rows: BoardRow[] = rs.map((r, i) => {
      const p = profile.get(r.user_id);
      return {
        userId: r.user_id,
        name: nameOf(r.user_id),
        flag: toFlagCode(p?.country_code),
        crest: crestFor(p?.country_code),
        score: compactScore(r.score_display, r.score_raw),
        sort: Number(r.score_sort_value),
        rank: i + 1,
        isMe: !!user && r.user_id === user.id,
      };
    });
    const mine = rows.find((r) => r.isMe) ?? null;
    const friendSet = new Set([...friendIds, ...(user ? [user.id] : [])]);
    const friends: FriendRow[] = [...friendSet]
      .map((id) => {
        const row = rows.find((r) => r.userId === id);
        return {
          userId: id,
          name: id === user?.id ? "you" : nameOf(id),
          crest: crestFor(profile.get(id)?.country_code),
          score: row?.score ?? null,
          sort: row?.sort ?? null,
          isMe: id === user?.id,
        };
      })
      .sort((a, b) => (b.sort ?? -1) - (a.sort ?? -1));
    boards[slug] = {
      slug,
      shots: rows.length,
      top: rows[0]?.score ?? null,
      global: rows.slice(0, 3),
      me: mine ? { rank: mine.rank, score: mine.score } : null,
      friends,
    };
  }

  // Today's Country Draft categories are public (rules: stats are shown up front).
  let draftCategories: string[] = [];
  try {
    const cfg = generateDraftConfig(getDailyRng(dateKey, edition), "daily", dateKey);
    draftCategories = cfg.categories.map((c) => c.shortLabel || c.label);
  } catch {
    draftCategories = [];
  }
  lap("draft");

  const me = user ? profile.get(user.id) : undefined;
  return {
    dateKey,
    signedIn: !!user,
    meName: me?.display_name || me?.username || null,
    meCrest: crestFor(me?.country_code),
    streak: me?.streak_current ?? null,
    friendCount: friendIds.length,
    boards,
    draftCategories,
  };
}
