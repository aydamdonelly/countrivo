import { getTodayDateKey } from "@/lib/daily-seed";
import { revalidateTag, unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";

/** The cache tag of the daily edition read; `rerollDailyAction` invalidates it. */
export const EDITION_TAG = "edition";

const QUERY_TIMEOUT_MS = 6000;

/** Cache each Berlin day's configured edition. A failed read must not invent a second board. */
const readEdition = unstable_cache(
  async (dateKey: string): Promise<string> => {
    const anon = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await anon.from("countrivo_config").select("key,value")
      .in("key", ["daily_edition", `edition:${dateKey}`]).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
    if(error)throw error;
    const value: unknown = data?.find((row)=>row.key === `edition:${dateKey}`)?.value ?? data?.find((row)=>row.key === "daily_edition")?.value;
    if (typeof value !== "string" || !value) throw new Error("Daily edition is unavailable");
    return value;
  },
  ["daily-edition"],
  { revalidate: 600, tags: [EDITION_TAG] },
);

export async function getEdition(): Promise<string> {
  try {
    return await readEdition(getTodayDateKey());
  } catch (err) {
    console.error("[edition] read failed", err);
    throw new Error("Today's boards could not be opened. Try again.");
  }
}

/**
 * Marks the cached edition stale (stale-while-revalidate). Call it from a server action
 * after the `admin_reroll_daily` RPC; `revalidateTag` only works in server functions and
 * route handlers. Next 16 deprecates the one-argument form, so the profile is explicit.
 */
export function revalidateEdition(): void {
  revalidateTag(EDITION_TAG, "max");
}
