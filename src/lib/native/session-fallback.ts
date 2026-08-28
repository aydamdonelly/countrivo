import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

const KEY = "cv_session";

/**
 * Mirror the current Supabase session tokens into secure native storage.
 * Call after a successful sign-in. No-op on the website.
 * (@supabase/ssr cookies are NOT HttpOnly, so the browser client can re-set
 *  them via setSession() on rehydrate.)
 */
export async function persistSession(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");
  const {
    data: { session },
  } = await createClient().auth.getSession();
  if (session) {
    await Preferences.set({
      key: KEY,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });
  }
}

/**
 * On cold start, if the WebView lost its cookie session, restore it from
 * native storage via setSession(). No-op on the website / if cookies survived.
 */
export async function rehydrateSession(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return; // cookies survived
  const { Preferences } = await import("@capacitor/preferences");
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return;
  // A corrupted / partially-written blob must not throw the user into a silent
  // signed-out state — drop the bad entry and let them sign in again cleanly.
  let parsed: { access_token: string; refresh_token: string } | null = null;
  try {
    parsed = JSON.parse(value);
  } catch {
    await Preferences.remove({ key: KEY });
    return;
  }
  if (!parsed?.access_token || !parsed?.refresh_token) return;
  await supabase.auth.setSession({
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
  });
}

/**
 * Native only: wipe the mirrored session on sign-out, so a cold relaunch does
 * NOT silently re-authenticate from stale tokens (privacy on shared devices).
 */
export async function clearPersistedSession(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.remove({ key: KEY });
}
