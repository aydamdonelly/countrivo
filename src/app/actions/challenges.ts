"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getRunDetail } from "./game-runs";
import type { RunDetail } from "@/types/server";

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
  _clientRunId?: number, // IGNORED — never trust a client-supplied run id
): Promise<{ success: boolean; challenge?: FriendChallenge; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };
  if (challengedId === user.id) return { success: false, error: "cannot_challenge_self" };

  // Must be an accepted friend (the friendship row is undirected).
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${challengedId}),` +
        `and(requester_id.eq.${challengedId},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();
  if (!friendship) return { success: false, error: "not_friends" };

  // Use the caller's OWN daily run, looked up server-side (the previous code
  // trusted a client run id, letting anyone pass a victim's high-scoring run).
  const { data: myRun } = await supabase
    .from("game_runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .eq("daily_date", dailyDate)
    .eq("mode", "daily")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!myRun) return { success: false, error: "no_run_yet" };

  const { data, error } = await supabase
    .from("friend_challenges")
    .insert({
      challenger_id: user.id,
      challenged_id: challengedId,
      game_slug: gameSlug,
      daily_date: dailyDate,
      challenger_run_id: myRun.id,
      status: "pending",
    })
    .select()
    .single();

  // 23505 = the (challenger,challenged,game,date) unique constraint → already challenged.
  if (error) {
    return { success: false, error: error.code === "23505" ? "already_challenged" : error.message };
  }
  return { success: true, challenge: mapChallenge(data) };
}

// ─── Get Pending Challenge Count (incoming, header badge) ────────────

export async function getPendingChallengeCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Match getPendingChallenges' window: only count duels the user can still
  // act on today, so the header badge never over-counts stale challenges that
  // no longer appear in the list (which made players distrust the badge).
  const { count } = await supabase
    .from("friend_challenges")
    .select("id", { count: "exact", head: true })
    .eq("challenged_id", user.id)
    .eq("status", "pending")
    .gte("daily_date", getTodayDateKey());
  return count ?? 0;
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
  _clientRunId?: number, // IGNORED — never trust a client-supplied run id (see createChallenge)
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

  // Same-day-puzzle invariant: a still-pending duel from a previous day cannot
  // be completed with a different day's run (mirrors getDuelById's guard).
  if (challenge.daily_date !== getTodayDateKey()) {
    return { success: false, error: "challenge_expired" };
  }

  // Resolve the caller's OWN run for this game+date server-side. The previous
  // code wrote a client-supplied run id straight into challenged_run_id, so a
  // user could attach another player's high-scoring run to win the duel.
  const { data: myRun } = await supabase
    .from("game_runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_slug", challenge.game_slug)
    .eq("daily_date", challenge.daily_date)
    .eq("mode", "daily")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!myRun) return { success: false, error: "no_run_yet" };

  // Idempotent + anti-race: only flip a still-pending duel (never overwrite a
  // finished one). .select distinguishes a fresh completion (1 row) from a no-op
  // retry (0 rows) so a double-tap or refresh doesn't re-fire the result UI.
  const { data: updated, error } = await supabase
    .from("friend_challenges")
    .update({ challenged_run_id: myRun.id, status: "completed" })
    .eq("id", challengeId)
    .eq("challenged_id", user.id)
    .eq("status", "pending")
    .select("id");

  if (error) return { success: false, error: error.message };
  if (!updated || updated.length === 0) return { success: false, error: "already_completed" };
  return { success: true };
}

// ─── Ghost Duels ──────────────────────────────────────────────────────

export interface DuelDetail {
  challenge: FriendChallenge;
  ghost: RunDetail | null; // the opponent's stored run — replayed beside you
}

/**
 * Fetch a pending duel the current user has been challenged to, plus the
 * opponent's full run (the ghost). V1 is same-day only so the live puzzle
 * (dateSeed(dailyDate+edition)) is provably identical to the ghost's.
 */
export async function getDuelById(
  duelId: number,
): Promise<{ success: boolean; duel?: DuelDetail; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { data: row } = await supabase
    .from("friend_challenges")
    .select(`*, challenger:profiles!friend_challenges_challenger_id_fkey(username, display_name)`)
    .eq("id", duelId)
    .eq("challenged_id", user.id)
    .single();

  if (!row) return { success: false, error: "duel_not_found" };
  if (row.status !== "pending") return { success: false, error: "duel_done" };
  if (row.daily_date !== getTodayDateKey()) return { success: false, error: "duel_expired" };

  const challenge: FriendChallenge = {
    ...mapChallenge(row),
    challengerProfile: row.challenger
      ? { username: row.challenger.username, displayName: row.challenger.display_name }
      : undefined,
  };
  const ghost = challenge.challengerRunId ? await getRunDetail(challenge.challengerRunId) : null;
  return { success: true, duel: { challenge, ghost } };
}

/**
 * Instant Quick Duel: match the player against a stored same-seed run near
 * their percentile (server RPC, never-empty fallback ladder), recording it as
 * a 'quick' friend_challenges row with the opponent as challenger (the ghost).
 */
export async function startQuickDuel(
  gameSlug: string,
  dailyDate: string,
): Promise<{ success: boolean; duelId?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const { data: match, error: rpcErr } = await supabase.rpc("match_quick_duel_opponent", {
    p_game_slug: gameSlug,
    p_daily_date: dailyDate,
    p_user_id: user.id,
  });
  if (rpcErr) return { success: false, error: rpcErr.message };

  const opponent = (Array.isArray(match) ? match[0] : match) as
    | { run_id: number; user_id: string }
    | null
    | undefined;
  if (!opponent?.run_id) return { success: false, error: "no_opponent_yet" };

  const { data, error } = await supabase
    .from("friend_challenges")
    .insert({
      challenger_id: opponent.user_id,
      challenged_id: user.id,
      game_slug: gameSlug,
      daily_date: dailyDate,
      challenger_run_id: opponent.run_id,
      duel_type: "quick",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, duelId: data.id as number };
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
