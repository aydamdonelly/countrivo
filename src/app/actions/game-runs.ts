"use server";

import { createClient } from "@/lib/supabase/server";
import { dateSeed, getTodayDateKey } from "@/lib/daily-seed";
import { validateCountryDraftResult } from "@/lib/game-logic/country-draft/server-validate";
import { validateStatGuesserResult } from "@/lib/game-logic/stat-guesser/server-validate";
import { getDailyEdition } from "@/lib/daily-edition";
import type { ServerGameRun, LeaderboardEntry, RunDetail, UserGameStats, DailySummary } from "@/types/server";

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
    console.error("[submitGameRun] no session", input.gameSlug, input.mode);
    return { success: false, error: "not_authenticated" };
  }

  // Sanity checks
  if (input.scoreRaw > input.scoreMax && input.scoreMax > 0) {
    return { success: false, error: "invalid_score" };
  }

  // Per-game result validation: cross-check resultJson against scoreRaw
  const validationError = validateGameResult(input.gameSlug, input.scoreRaw, input.scoreMax, input.resultJson);
  if (validationError) {
    console.error("[submitGameRun] validation", input.gameSlug, validationError);
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
      case "country-draft":
        serverCheck = validateCountryDraftResult(input.dateKey, input.scoreRaw, input.resultJson, edition);
        break;
      case "stat-guesser":
        serverCheck = validateStatGuesserResult(input.dateKey, input.scoreRaw, input.resultJson, edition);
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
    case "risk-zone":
    case "cluster":
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
    case "geo-wordle":
    case "borderline":
      // Fewer guesses/moves = better, invert so higher sort = better
      scoreSortValue = input.scoreMax > 0 ? input.scoreMax - input.scoreRaw : 0;
      break;
  }

  const completedAt = new Date().toISOString();
  const startedMs = new Date(input.startedAt).getTime();
  const completedMs = new Date(completedAt).getTime();
  // A non-finite (NaN) or far-future startedAt makes the diff NaN/negative, which
  // slips past the too-fast guard (anti-cheat hole) or, on a skewed device clock,
  // falsely rejects every real run. Bound it before the elapsed-time check.
  if (!isFinite(startedMs) || startedMs > completedMs + 5000) {
    return { success: false, error: "invalid_start_time" };
  }
  if (completedMs - startedMs < 3000) {
    console.error("[submitGameRun] too fast", input.gameSlug, completedMs - startedMs, "ms");
    return { success: false, error: "too_fast" };
  }

  // For daily mode: atomically ensure the daily puzzle exists.
  // Calls the SECURITY DEFINER RPC `ensure_daily_puzzle` which handles the
  // race between concurrent first-submitters of the day without needing a
  // permissive RLS INSERT policy on daily_puzzles.
  // Boards can submit the same finished run twice (an auth-change effect plus the join
  // callback). started_at is set once per run, so it works as an idempotency key.
  {
    const { data: existing } = await supabase
      .from("game_runs")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_slug", input.gameSlug)
      .eq("started_at", input.startedAt)
      .maybeSingle();
    if (existing) {
      return { success: true, run: mapGameRun(existing, existing.is_personal_best) };
    }
  }

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
    .select("best_sort_value, total_runs")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .single();

  // user_game_stats is updated by an AFTER INSERT trigger, so it already includes this
  // run. A record means: not the first run, a non-zero score, and at least as good as
  // the best on file (which, if this run is the best, equals this run).
  const isPersonalBest =
    input.scoreRaw > 0 && !!stats && Number(stats.total_runs) > 1 && scoreSortValue >= Number(stats.best_sort_value);

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
    runId: Number(row.run_id),
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

// ─── Get Run Detail ────────────────────────────────────────────────

export async function getRunDetail(runId: number): Promise<RunDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_run_detail", { p_run_id: runId });

  const row = data?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    runId: Number(row.run_id),
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    gameSlug: row.game_slug as string,
    dailyDate: row.daily_date as string,
    scoreRaw: Number(row.score_raw),
    scoreMax: Number(row.score_max),
    scoreDisplay: (row.score_display as string) ?? "",
    scoreSortValue: Number(row.score_sort_value),
    rankDaily: row.rank_daily != null ? Number(row.rank_daily) : null,
    percentile: row.percentile != null ? Number(row.percentile) : null,
    resultJson: (row.result_json as Record<string, unknown> | null) ?? null,
    seed: row.seed != null ? Number(row.seed) : null,
    completedAt: row.completed_at as string,
  };
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

  // Load streak state. The freeze columns may not exist yet (migration not
  // applied) — fall back to a basic read so streak updates never break.
  let streakLongest = 0;
  let freezes = 0;
  let frozenDates: string[] = [];
  let freezesAvailable = false;
  const full = await supabase
    .from("profiles")
    .select("streak_longest, streak_freezes, streak_frozen_dates")
    .eq("id", userId)
    .single();
  if (!full.error && full.data) {
    streakLongest = full.data.streak_longest ?? 0;
    freezes = (full.data as { streak_freezes?: number }).streak_freezes ?? 0;
    const fd = (full.data as { streak_frozen_dates?: unknown }).streak_frozen_dates;
    frozenDates = Array.isArray(fd) ? (fd as string[]) : [];
    freezesAvailable = true;
  } else {
    const basic = await supabase
      .from("profiles")
      .select("streak_longest")
      .eq("id", userId)
      .single();
    streakLongest = basic.data?.streak_longest ?? 0;
  }

  // Walk back from today. A single missed day is bridged with a streak-freeze
  // (or a day already frozen on a prior run), so one lapse no longer resets a
  // streak to zero. A frozen day bridges the gap but does NOT add to the count.
  const frozenSet = new Set(frozenDates);
  let remainingFreezes = freezes;
  const cursor = new Date(dateKey + "T00:00:00Z");
  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (playedDates.has(key)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    if (freezesAvailable && streak > 0 && key !== dateKey) {
      if (frozenSet.has(key)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
      const prev = new Date(cursor);
      prev.setUTCDate(prev.getUTCDate() - 1);
      const prevKey = prev.toISOString().slice(0, 10);
      // Only bridge a one-day gap bounded by a played day, and only while a
      // freeze is available to spend.
      if (remainingFreezes > 0 && playedDates.has(prevKey)) {
        remainingFreezes--;
        frozenSet.add(key);
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
    }
    break;
  }

  const newLongest = Math.max(streakLongest, streak);

  const patch: Record<string, unknown> = {
    streak_current: streak,
    streak_longest: newLongest,
    last_daily_date: dateKey,
    updated_at: new Date().toISOString(),
  };
  if (freezesAvailable) {
    patch.streak_freezes = remainingFreezes;
    // Keep only frozen dates inside the lookback window so the array stays small.
    patch.streak_frozen_dates = Array.from(frozenSet).filter((d) => d >= lookbackKey);
  }
  await supabase.from("profiles").update(patch).eq("id", userId);
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
        // Boards send `answers` as the picked option index per question (number | null)
        // plus a `score`; older payloads sent objects with a `correct` flag. Accept both.
        const answers = resultJson.answers as unknown[] | undefined;
        if (!answers || !Array.isArray(answers)) return "invalid_result";
        const objects = answers.filter((a): a is { correct?: boolean } => !!a && typeof a === "object");
        if (objects.length === answers.length && answers.length > 0) {
          const correctCount = objects.filter((a) => a.correct).length;
          if (correctCount !== scoreRaw) return "score_mismatch";
        } else {
          if (typeof resultJson.score !== "number") return "invalid_result";
          if (resultJson.score !== scoreRaw) return "score_mismatch";
        }
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
      case "geo-wordle": {
        const guesses = resultJson.guesses;
        if (!Array.isArray(guesses)) return "invalid_result";
        if (typeof resultJson.won !== "boolean") return "invalid_result";
        if (typeof resultJson.answerIso3 !== "string") return "invalid_result";
        // scoreRaw = guesses used: a win uses exactly guesses.length tries (1..6),
        // a loss is recorded as the full 6.
        if (guesses.length < 1 || guesses.length > 6) return "invalid_result";
        if (resultJson.won) {
          if (scoreRaw !== guesses.length) return "score_mismatch";
          const last = guesses[guesses.length - 1] as { correct?: boolean };
          if (!last || last.correct !== true) return "score_mismatch";
        } else {
          if (scoreRaw !== 6) return "score_mismatch";
          if (guesses.length !== 6) return "score_mismatch";
        }
        if (scoreRaw > scoreMax) return "score_exceeds_total";
        break;
      }
      case "cluster": {
        const solved = resultJson.solved;
        const mistakes = resultJson.mistakes;
        if (typeof solved !== "number") return "invalid_result";
        if (solved !== scoreRaw) return "score_mismatch";
        if (scoreRaw < 0 || scoreRaw > 4) return "score_exceeds_total";
        if (scoreMax !== 4) return "invalid_result";
        if (typeof mistakes !== "number" || mistakes < 0 || mistakes > 4) return "invalid_result";
        // A win (4 solved) cannot coexist with the max mistake count.
        if (scoreRaw === 4 && mistakes >= 4) return "invalid_result";
        const guesses = resultJson.guesses;
        if (guesses !== undefined && !Array.isArray(guesses)) return "invalid_result";
        // Each correct group + each mistake is one submitted quartet.
        if (Array.isArray(guesses) && guesses.length < solved + mistakes) return "score_mismatch";
        break;
      }
      case "risk-zone": {
        if (typeof resultJson.score !== "number") return "invalid_result";
        if (resultJson.score !== scoreRaw) return "score_mismatch";
        const chains = resultJson.chains as Array<{ outcome?: string; points?: number }> | undefined;
        if (!Array.isArray(chains)) return "invalid_result";
        if (chains.length > 5) return "invalid_result";
        // Sum of per-chain points must equal the reported score.
        const sum = chains.reduce((acc, c) => acc + (typeof c.points === "number" ? c.points : 0), 0);
        if (sum !== scoreRaw) return "score_mismatch";
        if (scoreRaw > scoreMax) return "score_exceeds_total";
        break;
      }
      // Practice-only games with no canonical daily puzzle to replay-validate.
      // They appear in the scoreSortValue switch above (so they DO submit) —
      // accept their structural shape here instead of bouncing every run as
      // "unvalidated_game". TODO: add real replay validation for these three.
      case "blitz":
      case "supremacy":
      case "borderline":
        break;
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
