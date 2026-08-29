import { revalidateTag, unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";

/** The cache tag of the daily edition read; `rerollDailyAction` invalidates it. */
export const EDITION_TAG = "edition";

const QUERY_TIMEOUT_MS = 6000;

/**
 * The global daily edition, a seed salt in `app_config.daily_edition` the admin bumps to
 * re-roll every daily for everyone. Read with the anon key (no cookie dependency, so guest
 * play pages do no DB work of their own) and cached for 60 s under the `edition` tag
 * (blueprint 9.1 step 3). A failed read throws out of the cache scope so a transient error
 * is never cached; the caller falls back to "" for that one request.
 */
const readEdition = unstable_cache(
  async (): Promise<string> => {
    const anon = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await anon
      .from("app_config")
      .select("value")
      .eq("key", "daily_edition")
      .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
      .maybeSingle();
    if (error) throw error;
    const value: unknown = data?.value;
    return typeof value === "string" ? value : "";
  },
  ["daily-edition"],
  { revalidate: 60, tags: [EDITION_TAG] },
);

export async function getEdition(): Promise<string> {
  try {
    return await readEdition();
  } catch (err) {
    console.error("[edition] read failed", err);
    return "";
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
