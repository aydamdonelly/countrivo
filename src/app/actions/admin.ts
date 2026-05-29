"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/daily-seed";
import { ADMIN_USER_ID } from "@/lib/admin";

interface RerollResult {
  success: boolean;
  edition?: string;
  error?: string;
}

/**
 * Admin-only: bump the global daily edition (re-rolling every RNG daily for
 * everyone) and wipe today's runs + recompute stats/streaks. The heavy lifting
 * runs in the SECURITY DEFINER RPC admin_reroll_daily, which re-checks the admin
 * uid itself — this action is a second gate for a clean error.
 */
export async function rerollDailyAction(): Promise<RerollResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return { success: false, error: "not_authorized" };
  }

  const { data, error } = await supabase.rpc("admin_reroll_daily", {
    p_date: getTodayDateKey(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true, edition: data == null ? undefined : String(data) };
}
