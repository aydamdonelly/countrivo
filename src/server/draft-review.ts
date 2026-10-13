import "server-only";
import { getTodayDateKey } from "@/lib/daily-seed";
import { gameModule } from "@/games/country-draft/module";
import { draftReviewView } from "@/lib/game-logic/country-draft/public-view";
import type { DraftState } from "@/lib/game-logic/country-draft/types";
import { replay } from "@/features/play/replay";
import { gameDatabase } from "./anonymous-identity";
import { frozenBoardState } from "./board-snapshots";

/** Exact-edition snapshot stays private; the projector unlocks values only after the day ends. */
export async function draftRunReview(runId: number) {
  const today = getTodayDateKey();
  const { data: run } = await gameDatabase().from("countrivo_runs").select("date_key,edition,seed,action_log")
    .eq("id", runId).eq("game_slug", "country-draft").eq("mode", "daily").eq("status", "complete").lte("date_key", today)
    .maybeSingle<{ date_key: string; edition: string; seed: number; action_log: string }>();
  if (!run) return null;
  const initial = await frozenBoardState<DraftState>("country-draft", run.date_key, run.edition);
  if (!initial) return null;
  const adapter = { ...gameModule, create: () => initial };
  const state = replay(adapter, run.seed, "daily", run.date_key, run.action_log).state;
  return draftReviewView(state, { mode: "daily", dateKey: run.date_key, today });
}
