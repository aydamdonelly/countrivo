import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import type { Profile } from "@/types/server";
import { GUEST_VIEWER, type Viewer } from "@/ui/types";

/** The profiles columns the shell reads: one select, the whole Profile shape. */
const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, country_code, streak_current, streak_longest, last_daily_date, created_at";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  streak_current: number | null;
  streak_longest: number | null;
  last_daily_date: string | null;
  created_at: string;
};

/** snake_case profiles row to the Profile contract (streak_* default 0). */
export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    streakCurrent: row.streak_current ?? 0,
    streakLongest: row.streak_longest ?? 0,
    lastDailyDate: row.last_daily_date,
    createdAt: row.created_at,
  };
}

/**
 * Who is looking (blueprint 9.1 step 2): the server Supabase client, one `auth.getUser()`,
 * one `profiles` select, resolved to the Viewer the layouts and pages render from. React
 * `cache()` dedupes it per request, so the layout, the page and any helper share one auth
 * call and one query. Anything that fails resolves to the guest viewer.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  let user: User | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return { ...GUEST_VIEWER };
  }
  if (!user) return { ...GUEST_VIEWER };

  let profile: Profile | null = null;
  try {
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
    profile = data ? mapProfileRow(data as ProfileRow) : null;
  } catch (err) {
    console.error("[viewer] profile select failed", err);
  }

  return {
    signedIn: true,
    user,
    profile,
    name: profile?.displayName || profile?.username || null,
    crest: getSilhouettePath(iso2ToIso3(profile?.countryCode)),
    streak: profile?.streakCurrent ?? 0,
  };
});

/**
 * Pending friend requests addressed to the viewer (the `Friends 2` count in the tab bar,
 * blueprint 3.27). Signed-in viewers only; one count query on top of the viewer's session,
 * no second auth call. Cached per request.
 */
export const getPendingRequestCount = cache(async (): Promise<number> => {
  const viewer = await getViewer();
  if (!viewer.user) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", viewer.user.id)
      .eq("status", "pending");
    return count ?? 0;
  } catch (err) {
    console.error("[viewer] pending count failed", err);
    return 0;
  }
});
