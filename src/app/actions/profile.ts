"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { Profile } from "@/types/server";

// ─── Update Profile ──────────────────────────────────────────────────

interface UpdateProfileInput {
  displayName: string;
  countryCode: string | null;
}

interface UpdateProfileResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const name = input.displayName.trim();
  if (name.length < 1 || name.length > 30) {
    return { success: false, error: "Display name must be 1-30 characters" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      country_code: input.countryCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, profile: mapProfile(data) };
}

// ─── Update Username ────────────────────────────────────────────────

interface UpdateUsernameResult {
  success: boolean;
  error?: string;
}

export async function updateUsername(newUsername: string): Promise<UpdateUsernameResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  const cleaned = newUsername.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(cleaned)) {
    return { success: false, error: "Username must be 3-20 characters, lowercase alphanumeric and hyphens, cannot start or end with hyphen" };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", cleaned)
    .neq("id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "Username already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: cleaned, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Get Public Profile ──────────────────────────────────────────────

interface PublicProfileData {
  profile: Profile;
  gameStats: {
    gameSlug: string;
    totalRuns: number;
    bestScoreRaw: number;
    bestScoreMax: number;
  }[];
  totalRuns: number;
  totalDailyRuns: number;
}

export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const { data: stats } = await supabase
    .from("user_game_stats")
    .select("game_slug, total_runs, total_daily_runs, best_score_raw, best_score_max")
    .eq("user_id", profile.id)
    .order("total_runs", { ascending: false });

  const gameStats = (stats ?? []).map((s) => ({
    gameSlug: s.game_slug as string,
    totalRuns: s.total_runs as number,
    bestScoreRaw: s.best_score_raw as number,
    bestScoreMax: s.best_score_max as number,
  }));

  const totalRuns = gameStats.reduce((sum, s) => sum + s.totalRuns, 0);
  const totalDailyRuns = (stats ?? []).reduce((sum, s) => sum + (s.total_daily_runs as number), 0);

  return {
    profile: mapProfile(profile),
    gameStats,
    totalRuns,
    totalDailyRuns,
  };
}

// ─── Get Pending Friend Request Count ────────────────────────────────

export async function getPendingRequestCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  return count ?? 0;
}

// ─── Profile Today Runs ─────────────────────────────────────────────

export async function getProfileTodayRuns(userId: string): Promise<{
  gameSlug: string;
  scoreDisplay: string;
  rankDaily: number | null;
  percentile: number | null;
}[]> {
  const supabase = await createClient();
  const dateKey = getTodayDateKey();
  const { data } = await supabase
    .from("game_runs")
    .select("game_slug, score_display, rank_daily, percentile")
    .eq("user_id", userId)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .order("game_slug");

  return (data ?? []).map((r) => ({
    gameSlug: r.game_slug as string,
    scoreDisplay: r.score_display as string,
    rankDaily: r.rank_daily as number | null,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  }));
}

// ─── Head-to-Head ───────────────────────────────────────────────────

export async function getHeadToHead(userId: string, friendId: string): Promise<{
  wins: number;
  losses: number;
  draws: number;
  recent: { gameSlug: string; dailyDate: string; myScore: string; theirScore: string; mySort: number; theirSort: number }[];
}> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const [{ data: myRuns }, { data: theirRuns }] = await Promise.all([
    supabase
      .from("game_runs")
      .select("game_slug, daily_date, score_display, score_sort_value")
      .eq("user_id", userId)
      .eq("mode", "daily")
      .gte("daily_date", sinceDate),
    supabase
      .from("game_runs")
      .select("game_slug, daily_date, score_display, score_sort_value")
      .eq("user_id", friendId)
      .eq("mode", "daily")
      .gte("daily_date", sinceDate),
  ]);

  const theirRunMap = new Map<string, { scoreDisplay: string; scoreSortValue: number }>();
  for (const r of theirRuns ?? []) {
    theirRunMap.set(`${r.game_slug}:${r.daily_date}`, {
      scoreDisplay: r.score_display as string,
      scoreSortValue: Number(r.score_sort_value ?? 0),
    });
  }

  let wins = 0, losses = 0, draws = 0;
  const recent: { gameSlug: string; dailyDate: string; myScore: string; theirScore: string; mySort: number; theirSort: number }[] = [];

  for (const r of myRuns ?? []) {
    const key = `${r.game_slug}:${r.daily_date}`;
    const theirs = theirRunMap.get(key);
    if (!theirs) continue;

    const mySort = Number(r.score_sort_value ?? 0);
    if (mySort > theirs.scoreSortValue) wins++;
    else if (mySort < theirs.scoreSortValue) losses++;
    else draws++;

    recent.push({
      gameSlug: r.game_slug as string,
      dailyDate: r.daily_date as string,
      myScore: r.score_display as string,
      theirScore: theirs.scoreDisplay,
      mySort,
      theirSort: theirs.scoreSortValue,
    });
  }

  recent.sort((a, b) => b.dailyDate.localeCompare(a.dailyDate) || a.gameSlug.localeCompare(b.gameSlug));

  return { wins, losses, draws, recent: recent.slice(0, 10) };
}

// ─── Helpers ─────────────────────────────────────────────────────────

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
