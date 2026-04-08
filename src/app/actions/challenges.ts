"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/daily-seed";

export interface FriendChallenge {
  id: number;
  challengerId: string;
  challengedId: string;
  gameSlug: string;
  dailyDate: string;
  challengerRunId: number | null;
  challengedRunId: number | null;
  status: "pending" | "completed" | "expired";
  createdAt: string;
  challengerProfile?: { username: string; displayName: string | null };
  challengedProfile?: { username: string; displayName: string | null };
  challengerScore?: string | null;
  challengedScore?: string | null;
}

// ─── Create Challenge ─────────────────────────────────────────────────

export async function createChallenge(
  challengedId: string,
  gameSlug: string,
  dailyDate: string,
  challengerRunId: number
): Promise<{ success: boolean; challenge?: FriendChallenge; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { data, error } = await supabase
    .from("friend_challenges")
    .insert({
      challenger_id: user.id,
      challenged_id: challengedId,
      game_slug: gameSlug,
      daily_date: dailyDate,
      challenger_run_id: challengerRunId,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, challenge: mapChallenge(data) };
}

// ─── Get Pending Challenges (incoming) ───────────────────────────────

export async function getPendingChallenges(): Promise<FriendChallenge[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friend_challenges")
    .select(`
      *,
      challenger:profiles!friend_challenges_challenger_id_fkey(username, display_name),
      challenger_run:game_runs!friend_challenges_challenger_run_id_fkey(score_display)
    `)
    .eq("challenged_id", user.id)
    .eq("status", "pending")
    .gte("daily_date", getTodayDateKey())
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...mapChallenge(row),
    challengerProfile: row.challenger
      ? { username: row.challenger.username, displayName: row.challenger.display_name }
      : undefined,
    challengerScore: row.challenger_run?.score_display ?? null,
  }));
}

// ─── Get My Outgoing Challenges ───────────────────────────────────────

export async function getMyOutgoingChallenges(): Promise<FriendChallenge[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friend_challenges")
    .select(`
      *,
      challenged:profiles!friend_challenges_challenged_id_fkey(username, display_name),
      challenged_run:game_runs!friend_challenges_challenged_run_id_fkey(score_display)
    `)
    .eq("challenger_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    ...mapChallenge(row),
    challengedProfile: row.challenged
      ? { username: row.challenged.username, displayName: row.challenged.display_name }
      : undefined,
    challengedScore: row.challenged_run?.score_display ?? null,
  }));
}

// ─── Complete Challenge ───────────────────────────────────────────────

export async function completeChallenge(
  challengeId: number,
  myRunId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { data: challenge } = await supabase
    .from("friend_challenges")
    .select("game_slug, daily_date")
    .eq("id", challengeId)
    .eq("challenged_id", user.id)
    .single();

  if (!challenge) return { success: false, error: "challenge_not_found" };

  const { error } = await supabase
    .from("friend_challenges")
    .update({ challenged_run_id: myRunId, status: "completed" })
    .eq("id", challengeId)
    .eq("challenged_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Get Recent Challenge Results ────────────────────────────────────

export interface ChallengeResult {
  id: number;
  gameSlug: string;
  dailyDate: string;
  challengerProfile: { username: string; displayName: string | null };
  challengedProfile: { username: string; displayName: string | null };
  challengerScore: string | null;
  challengedScore: string | null;
  challengerSortValue: number;
  challengedSortValue: number;
  winnerId: string | null;
}

export async function getRecentChallengeResults(limit: number = 10): Promise<ChallengeResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friend_challenges")
    .select(`
      *,
      challenger:profiles!friend_challenges_challenger_id_fkey(username, display_name),
      challenged:profiles!friend_challenges_challenged_id_fkey(username, display_name),
      challenger_run:game_runs!friend_challenges_challenger_run_id_fkey(score_display, score_sort_value),
      challenged_run:game_runs!friend_challenges_challenged_run_id_fkey(score_display, score_sort_value)
    `)
    .eq("status", "completed")
    .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const cSort = Number(row.challenger_run?.score_sort_value ?? 0);
    const dSort = Number(row.challenged_run?.score_sort_value ?? 0);
    let winnerId: string | null = null;
    if (cSort > dSort) winnerId = row.challenger_id;
    else if (dSort > cSort) winnerId = row.challenged_id;

    return {
      id: row.id,
      gameSlug: row.game_slug,
      dailyDate: row.daily_date,
      challengerProfile: row.challenger ? { username: row.challenger.username, displayName: row.challenger.display_name } : { username: "?", displayName: null },
      challengedProfile: row.challenged ? { username: row.challenged.username, displayName: row.challenged.display_name } : { username: "?", displayName: null },
      challengerScore: row.challenger_run?.score_display ?? null,
      challengedScore: row.challenged_run?.score_display ?? null,
      challengerSortValue: cSort,
      challengedSortValue: dSort,
      winnerId,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mapChallenge(row: Record<string, unknown>): FriendChallenge {
  return {
    id: row.id as number,
    challengerId: row.challenger_id as string,
    challengedId: row.challenged_id as string,
    gameSlug: row.game_slug as string,
    dailyDate: row.daily_date as string,
    challengerRunId: (row.challenger_run_id as number | null) ?? null,
    challengedRunId: (row.challenged_run_id as number | null) ?? null,
    status: row.status as "pending" | "completed" | "expired",
    createdAt: row.created_at as string,
  };
}
