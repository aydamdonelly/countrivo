"use server";

import { createClient } from "@/lib/supabase/server";
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
