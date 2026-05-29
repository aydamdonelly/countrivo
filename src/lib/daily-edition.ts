import { createClient } from "@/lib/supabase/server";

/**
 * The global daily "edition" — a seed salt stored in app_config that the admin
 * can bump to re-roll every RNG daily for everyone. Read server-side on the play
 * pages (passed to boards as a prop so SSR and client agree) and in submitGameRun
 * (passed to the server-side validators), keeping client puzzle and server
 * validation in lockstep.
 */
export async function getDailyEdition(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "daily_edition")
      .single();
    return data?.value ?? "";
  } catch {
    return "";
  }
}
