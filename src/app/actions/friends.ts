"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { Profile, LeaderboardEntry } from "@/types/server";

export interface FriendEntry {
  friendshipId: number;
  profile: Profile;
  todayScore: { gameSlug: string; scoreDisplay: string; rankDaily: number | null } | null;
}

export interface PendingRequest {
  friendshipId: number;
  profile: Profile;
  createdAt: string;
}

// ─── Search Users ─────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Sanitize query for ilike: escape special SQL wildcard characters
  const sanitized = query.trim().replace(/[%_\\]/g, (ch) => `\\${ch}`);

  // Get existing friend IDs to exclude (bounded)
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .limit(500);

  const friendIds = new Set<string>();
  friendIds.add(user.id);
  for (const f of friendships ?? []) {
    friendIds.add(f.requester_id);
    friendIds.add(f.addressee_id);
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`)
    .limit(10);

  return (data ?? [])
    .filter((p) => !friendIds.has(p.id))
    .map(mapProfile);
}

// ─── Send Friend Request ──────────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: "pending" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Respond to Friend Request ────────────────────────────────────────

export async function respondToFriendRequest(friendshipId: number, accept: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  if (accept) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId)
      .eq("addressee_id", user.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .eq("addressee_id", user.id);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

// ─── Remove Friend ────────────────────────────────────────────────────

export async function removeFriend(friendshipId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Get Friends ──────────────────────────────────────────────────────

export async function getFriends(): Promise<FriendEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (!friendships?.length) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", friendIds);

  const todayKey = getTodayDateKey();
  const { data: todayRuns } = await supabase
    .from("game_runs")
    .select("user_id, game_slug, score_display, rank_daily")
    .in("user_id", friendIds)
    .eq("daily_date", todayKey)
    .eq("mode", "daily")
    .eq("game_slug", "country-draft"); // flagship game

  const runByUserId = new Map(
    (todayRuns ?? []).map((r) => [r.user_id, r])
  );

  return (profiles ?? []).map((p) => {
    const friendship = friendships.find(
      (f) => f.requester_id === p.id || f.addressee_id === p.id
    )!;
    const run = runByUserId.get(p.id);
    return {
      friendshipId: friendship.id,
      profile: mapProfile(p),
      todayScore: run
        ? { gameSlug: run.game_slug, scoreDisplay: run.score_display, rankDaily: run.rank_daily }
        : null,
    };
  });
}

// ─── Get Pending Requests ─────────────────────────────────────────────

export async function getPendingRequests(): Promise<PendingRequest[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!friendships?.length) return [];

  const requesterIds = friendships.map((f) => f.requester_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", requesterIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return friendships
    .filter((f) => profileById.has(f.requester_id))
    .map((f) => ({
      friendshipId: f.id,
      profile: mapProfile(profileById.get(f.requester_id)!),
      createdAt: f.created_at,
    }));
}

// ─── Friends Leaderboard ──────────────────────────────────────────────

export async function getFriendsLeaderboard(gameSlug: string, dateKey: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  // Include self
  const allIds = [user.id, ...friendIds];

  const { data: runs } = await supabase
    .from("game_runs")
    .select("user_id, score_raw, score_max, score_display, score_sort_value, rank_daily, percentile")
    .in("user_id", allIds)
    .eq("game_slug", gameSlug)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .order("score_sort_value", { ascending: false });

  if (!runs?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", allIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return runs
    .filter((r) => profileById.has(r.user_id))
    .map((r, i) => {
      const p = profileById.get(r.user_id)!;
      return {
        userId: r.user_id,
        username: p.username,
        displayName: p.display_name ?? p.username,
        avatarUrl: p.avatar_url ?? null,
        scoreRaw: r.score_raw,
        scoreMax: r.score_max,
        scoreDisplay: r.score_display,
        scoreSortValue: r.score_sort_value,
        rankDaily: r.rank_daily ?? i + 1,
        percentile: r.percentile ?? 0,
      };
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mapProfile(p: Record<string, unknown>): Profile {
  return {
    id: p.id as string,
    username: p.username as string,
    displayName: (p.display_name as string | null) ?? null,
    avatarUrl: (p.avatar_url as string | null) ?? null,
    countryCode: (p.country_code as string | null) ?? null,
    streakCurrent: (p.streak_current as number) ?? 0,
    streakLongest: (p.streak_longest as number) ?? 0,
    lastDailyDate: (p.last_daily_date as string | null) ?? null,
    createdAt: p.created_at as string,
  };
}
