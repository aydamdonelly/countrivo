"use server";

import { createClient } from "@/lib/supabase/server";
import { dateSeed, getTodayDateKey } from "@/lib/daily-seed";
import { validateTraceResult } from "@/lib/game-logic/trace/server-validate";
import { validateCountryDraftResult } from "@/lib/game-logic/country-draft/server-validate";
import { validateStatGuesserResult } from "@/lib/game-logic/stat-guesser/server-validate";
import { validateClusterResult } from "@/lib/game-logic/cluster/server-validate";
import { getDailyEdition } from "@/lib/daily-edition";
import type { ServerGameRun, LeaderboardEntry, UserGameStats, DailySummary } from "@/types/server";

// ─── Submit Game Run ───────────────────────────────────────────────

interface SubmitGameRunInput {
  gameSlug: string;
  mode: "daily" | "practice";
  dateKey: string;
  scoreRaw: number;
  scoreMax: number;
  scoreSortValue: number;
  scoreDisplay: string;
  resultJson: Record<string, unknown>;
  startedAt: string;
}

interface SubmitGameRunResult {
  success: boolean;
  run?: ServerGameRun;
  error?: string;
}

export async function submitGameRun(input: SubmitGameRunInput): Promise<SubmitGameRunResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "not_authenticated" };
  }

  // Sanity checks
  if (input.scoreRaw > input.scoreMax && input.scoreMax > 0) {
    return { success: false, error: "invalid_score" };
  }

  // Per-game result validation: cross-check resultJson against scoreRaw
  const validationError = validateGameResult(input.gameSlug, input.scoreRaw, input.scoreMax, input.resultJson);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // Validate dateKey matches server's Europe/Berlin date (prevent timezone manipulation)
  if (input.mode === "daily") {
    const serverDateKey = getTodayDateKey();
    if (input.dateKey !== serverDateKey) {
      input.dateKey = serverDateKey; // Use server truth
    }
  }

  // Server-side re-compute anti-cheat: for the four scored daily games we
  // replay the engine with the same daily seed and confirm the submitted
  // resultJson is consistent with what the deterministic puzzle produces.
  // Practice runs are not validated (no canonical puzzle to compare against).
  if (input.mode === "daily") {
    let serverCheck: { valid: boolean; reason?: string } | null = null;
    const edition = await getDailyEdition();
    switch (input.gameSlug) {
      case "trace":
        serverCheck = validateTraceResult(input.dateKey, input.scoreRaw, input.resultJson, edition);
        break;
      case "country-draft":
        serverCheck = validateCountryDraftResult(input.dateKey, input.scoreRaw, input.resultJson, edition);
        break;
      case "stat-guesser":
        serverCheck = validateStatGuesserResult(input.dateKey, input.scoreRaw, input.resultJson, edition);
        break;
      case "cluster":
        serverCheck = await validateClusterResult(input.dateKey, input.scoreRaw, input.resultJson);
        break;
    }
    if (serverCheck && !serverCheck.valid) {
      return {
        success: false,
        error: `server_validation_failed: ${serverCheck.reason ?? "unknown"}`,
      };
    }
  }

  // Server-side scoreSortValue override for known games
  // Prevents client manipulation of ranking values
  let scoreSortValue = input.scoreSortValue;
  switch (input.gameSlug) {
    case "flag-quiz":
    case "capital-match":
    case "odd-one-out":
    case "country-streak":
    case "speed-flags":
    case "blitz":
    case "continent-sprint":
    case "border-buddies":
    case "population-sort":
    case "stat-guesser":
    case "supremacy":
    case "higher-or-lower":
      // For these games, higher score_raw = better
      scoreSortValue = input.scoreRaw;
      break;
    case "country-draft":
      // Lower score = better, invert for ranking (8*243 = theoretical max)
      scoreSortValue = 1944 - input.scoreRaw;
      break;
    case "borderline":
      // Fewer moves = better, invert
      scoreSortValue = input.scoreMax > 0 ? input.scoreMax - input.scoreRaw : 0;
      break;
    case "trace":
      // Fewer guesses = better, scoreRaw = 1-7, invert
      scoreSortValue = 7 - input.scoreRaw;
      break;
  }

  const completedAt = new Date().toISOString();
  const startedMs = new Date(input.startedAt).getTime();
  const completedMs = new Date(completedAt).getTime();
  if (completedMs - startedMs < 3000) {
    return { success: false, error: "too_fast" };
  }

  // For daily mode: atomically ensure the daily puzzle exists.
  // Calls the SECURITY DEFINER RPC `ensure_daily_puzzle` which handles the
  // race between concurrent first-submitters of the day without needing a
  // permissive RLS INSERT policy on daily_puzzles.
  let dailyPuzzleId: number | null = null;
  if (input.mode === "daily") {
    const seed = dateSeed(input.dateKey + input.gameSlug);
    const { data: puzzleId } = await supabase.rpc("ensure_daily_puzzle", {
      p_game_slug: input.gameSlug,
      p_daily_date: input.dateKey,
      p_seed: seed,
    });
    dailyPuzzleId = typeof puzzleId === "number" ? puzzleId : null;
  }

  // Insert the game run
  const { data: run, error } = await supabase
    .from("game_runs")
    .insert({
      user_id: user.id,
      game_slug: input.gameSlug,
      daily_puzzle_id: dailyPuzzleId,
      mode: input.mode,
      daily_date: input.mode === "daily" ? input.dateKey : null,
      score_raw: input.scoreRaw,
      score_max: input.scoreMax,
      score_sort_value: scoreSortValue,
      score_display: input.scoreDisplay,
      result_json: input.resultJson,
      started_at: input.startedAt,
      completed_at: completedAt,
    })
    .select("id")
    .single();

  if (error) {
    // Unique constraint violation → already played today
    if (error.code === "23505") {
      return { success: false, error: "already_played" };
    }
    return { success: false, error: error.message };
  }

  // Compute daily rankings (trigger already updated user_game_stats)
  if (input.mode === "daily") {
    await supabase.rpc("compute_daily_rankings", {
      p_game_slug: input.gameSlug,
      p_daily_date: input.dateKey,
    });

    // Update streak
    await updateStreak(supabase, user.id, input.dateKey);
  }

  // Re-fetch the run with computed rank + percentile
  const { data: finalRun } = await supabase
    .from("game_runs")
    .select("*")
    .eq("id", run.id)
    .single();

  // Check if personal best
  const { data: stats } = await supabase
    .from("user_game_stats")
    .select("best_sort_value")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .single();

  const isPersonalBest = stats ? scoreSortValue >= stats.best_sort_value : true;

  if (isPersonalBest && finalRun) {
    await supabase
      .from("game_runs")
      .update({ is_personal_best: true })
      .eq("id", run.id);
  }

  if (!finalRun) {
    return { success: false, error: "run_not_found" };
  }

  return {
    success: true,
    run: mapGameRun(finalRun, isPersonalBest),
  };
}

// ─── Check Daily Status ────────────────────────────────────────────

interface DailyStatusResult {
  played: boolean;
  run?: ServerGameRun;
}

export async function checkDailyStatus(
  gameSlug: string,
  dateKey: string
): Promise<DailyStatusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { played: false };
  }

  const { data } = await supabase
    .from("game_runs")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .single();

  if (!data) {
    return { played: false };
  }

  return { played: true, run: mapGameRun(data, data.is_personal_best) };
}

// ─── Get Daily Leaderboard ─────────────────────────────────────────

export async function getDailyLeaderboard(
  gameSlug: string,
  dateKey: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_daily_leaderboard", {
    p_game_slug: gameSlug,
    p_daily_date: dateKey,
    p_limit: limit,
  });

  if (!data) return [];

  return data.map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    avatarUrl: row.avatar_url as string | null,
    scoreRaw: row.score_raw as number,
    scoreMax: row.score_max as number,
    scoreDisplay: row.score_display as string,
    scoreSortValue: row.score_sort_value as number,
    rankDaily: row.rank_daily as number,
    percentile: row.percentile as number,
  }));
}

// ─── Get Daily Summary ─────────────────────────────────────────────

export async function getDailySummary(
  gameSlug: string,
  dateKey: string
): Promise<DailySummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_daily_summary", {
    p_game_slug: gameSlug,
    p_daily_date: dateKey,
  });

  const row = data?.[0];
  if (!row) {
    return { playerCount: 0, avgScore: 0, topScoreRaw: null, topScoreDisplay: null };
  }

  return {
    playerCount: Number(row.player_count) || 0,
    avgScore: Number(row.avg_score) || 0,
    topScoreRaw: row.top_score_raw as number | null,
    topScoreDisplay: row.top_score_display as string | null,
  };
}

// ─── Get User Game Stats ───────────────────────────────────────────

export async function getUserGameStats(
  gameSlug: string
): Promise<UserGameStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_game_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .single();

  if (!data) return null;

  return {
    bestScoreRaw: data.best_score_raw,
    bestScoreMax: data.best_score_max,
    bestSortValue: Number(data.best_sort_value),
    avgSortValue: Number(data.avg_sort_value),
    totalRuns: data.total_runs,
    totalDailyRuns: data.total_daily_runs,
    lastPlayedAt: data.last_played_at,
  };
}

// ─── Get User's Today Daily Runs ──────────────────────────────────

export interface TodayRun {
  gameSlug: string;
  scoreRaw: number;
  scoreMax: number;
  scoreDisplay: string;
  scoreSortValue: number;
  rankDaily: number | null;
  percentile: number | null;
}

export async function getUserTodayRuns(userId: string): Promise<TodayRun[]> {
  const supabase = await createClient();
  const dateKey = getTodayDateKey();

  const { data } = await supabase
    .from("game_runs")
    .select("game_slug, score_raw, score_max, score_display, score_sort_value, rank_daily, percentile")
    .eq("user_id", userId)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .order("game_slug");

  return (data ?? []).map((r) => ({
    gameSlug: r.game_slug as string,
    scoreRaw: r.score_raw as number,
    scoreMax: r.score_max as number,
    scoreDisplay: r.score_display as string,
    scoreSortValue: Number(r.score_sort_value ?? 0),
    rankDaily: r.rank_daily as number | null,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────

async function updateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateKey: string
) {
  // Aggregation-based: recompute streak from game_runs.daily_date instead of
  // incrementing the previous value. Two concurrent submits both land on the
  // same final streak value, so the race condition that caused missed
  // increments disappears.
  const lookback = new Date(dateKey + "T00:00:00Z");
  lookback.setUTCDate(lookback.getUTCDate() - 365);
  const lookbackKey = lookback.toISOString().slice(0, 10);

  const { data: runs } = await supabase
    .from("game_runs")
    .select("daily_date")
    .eq("user_id", userId)
    .eq("mode", "daily")
    .gte("daily_date", lookbackKey)
    .order("daily_date", { ascending: false });

  const playedDates = new Set<string>();
  for (const row of runs ?? []) {
    if (typeof row.daily_date === "string") playedDates.add(row.daily_date);
  }

  // Always include the just-submitted dateKey: the insert may not yet be
  // visible to this query under read-committed isolation.
  playedDates.add(dateKey);

  const cursor = new Date(dateKey + "T00:00:00Z");
  let streak = 0;
  while (playedDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_longest")
    .eq("id", userId)
    .single();

  const newLongest = Math.max(profile?.streak_longest ?? 0, streak);

  await supabase
    .from("profiles")
    .update({
      streak_current: streak,
      streak_longest: newLongest,
      last_daily_date: dateKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

// ─── Per-Game Result Validation ───────────────────────────────────

function validateGameResult(
  gameSlug: string,
  scoreRaw: number,
  scoreMax: number,
  resultJson: Record<string, unknown>
): string | null {
  try {
    switch (gameSlug) {
      case "flag-quiz":
      case "capital-match": {
        const answers = resultJson.answers as Array<{ correct?: boolean }> | undefined;
        if (!answers || !Array.isArray(answers)) return "invalid_result";
        const correctCount = answers.filter((a) => a.correct).length;
        if (correctCount !== scoreRaw) return "score_mismatch";
        if (scoreRaw > answers.length) return "score_exceeds_total";
        break;
      }
      case "odd-one-out": {
        const answers = resultJson.answers as unknown[] | undefined;
        if (!answers || !Array.isArray(answers)) return "invalid_result";
        if (typeof resultJson.score !== "number") return "invalid_result";
        if (resultJson.score !== scoreRaw) return "score_mismatch";
        if (scoreRaw > answers.length) return "score_exceeds_total";
        break;
      }
      case "higher-or-lower": {
        if (typeof resultJson.streak !== "number") return "invalid_result";
        if (resultJson.streak !== scoreRaw) return "score_mismatch";
        break;
      }
      case "country-streak": {
        if (typeof resultJson.streak !== "number") return "invalid_result";
        if (resultJson.streak !== scoreRaw) return "score_mismatch";
        if (scoreRaw > 243) return "score_exceeds_total";
        break;
      }
      case "speed-flags": {
        if (typeof resultJson.correct !== "number") return "invalid_result";
        if (resultJson.correct !== scoreRaw) return "score_mismatch";
        if (typeof resultJson.total === "number" && scoreRaw > resultJson.total) return "score_exceeds_total";
        break;
      }
      case "population-sort": {
        if (typeof resultJson.score !== "number") return "invalid_result";
        if (resultJson.score !== scoreRaw) return "score_mismatch";
        const userOrder = resultJson.userOrder;
        const correctOrder = resultJson.correctOrder;
        if (!Array.isArray(userOrder) || !Array.isArray(correctOrder)) return "invalid_result";
        if (userOrder.length !== correctOrder.length) return "invalid_result";
        break;
      }
      case "stat-guesser": {
        if (typeof resultJson.avgError !== "number") return "invalid_result";
        const expectedScore = Math.round(Math.max(0, 100 - resultJson.avgError));
        if (Math.abs(expectedScore - scoreRaw) > 1) return "score_mismatch";
        break;
      }
      case "country-draft": {
        if (typeof resultJson.playerScore !== "number") return "invalid_result";
        if (resultJson.playerScore !== scoreRaw) return "score_mismatch";
        if (typeof resultJson.optimalScore === "number" && typeof resultJson.gap === "number") {
          if (Math.abs((resultJson.playerScore - resultJson.optimalScore) - resultJson.gap) > 1) {
            return "score_mismatch";
          }
        }
        break;
      }
      case "border-buddies": {
        const found = resultJson.found;
        if (!Array.isArray(found)) return "invalid_result";
        if (found.length !== scoreRaw) return "score_mismatch";
        if (scoreRaw > scoreMax) return "score_exceeds_total";
        break;
      }
      case "continent-sprint": {
        if (typeof resultJson.found !== "number") return "invalid_result";
        if (resultJson.found !== scoreRaw) return "score_mismatch";
        if (scoreRaw > scoreMax) return "score_exceeds_total";
        break;
      }
      case "trace": {
        const guesses = resultJson.guesses;
        if (!Array.isArray(guesses)) return "invalid_result";
        if (typeof resultJson.guessCount !== "number") return "invalid_result";
        if (typeof resultJson.target !== "string") return "invalid_result";
        const won = resultJson.won === true;
        const expectedRaw = won ? guesses.length : 7;
        if (scoreRaw !== expectedRaw) return "score_mismatch";
        if (guesses.length > 6) return "score_exceeds_total";
        break;
      }
      default:
        return "unvalidated_game";
    }
  } catch {
    return "validation_error";
  }
  return null;
}

function mapGameRun(
  row: Record<string, unknown>,
  isPersonalBest: boolean
): ServerGameRun {
  return {
    id: row.id as number,
    gameSlug: row.game_slug as string,
    mode: row.mode as string,
    dailyDate: row.daily_date as string | null,
    scoreRaw: row.score_raw as number,
    scoreMax: row.score_max as number,
    scoreDisplay: (row.score_display as string) ?? "",
    scoreSortValue: Number(row.score_sort_value ?? 0),
    scoreNormalized: Number(row.score_normalized ?? 0),
    rankDaily: row.rank_daily as number | null,
    percentile: row.percentile != null ? Number(row.percentile) : null,
    isPersonalBest,
    resultJson: (row.result_json as Record<string, unknown>) ?? {},
    completedAt: row.completed_at as string,
  };
}
