"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { persistSession, clearPersistedSession } from "@/lib/native/session-fallback";
import { isAllowedHandle } from "@/lib/profanity";
import { updateProfile } from "@/app/actions/profile";
import type { Profile } from "@/types/server";
import { AUTH_EVENT } from "@/ui/types";

/*
 * The auth provider, ported 1:1 from the contract in understand.json native.auth. Every
 * invariant is load-bearing:
 *
 * 1. `userRef` mirrors `user`, is written only in effects and handlers, and is what
 *    `openAuthModal` reads, so `openAuthModal`'s identity is stable (boards depend on it).
 * 2. `openAuthModal(onSuccess)` short-circuits when a user (real or anonymous) exists.
 * 3. `closeAuthModal()` clears the pending callback.
 * 4. `profileGenRef` guards every background profile fetch; any local write of a fresher
 *    profile bumps it first.
 * 5. The initial `getUser()` has a 3 s fallback.
 * 6. `onAuthStateChange` sets the user synchronously and defers all follow-up work with
 *    `setTimeout(0)` (Supabase holds its auth lock during the callback); PASSWORD_RECOVERY
 *    skips the callback and leaves the sheet alone; otherwise the callback runs and the
 *    sheet closes here, never from the sheet's own code.
 * 7. `signOut()` clears the native mirror before `auth.signOut()`.
 * 8. `fetchProfile` reads `profiles` through the browser client.
 *
 * Additions for the rebuild (blueprint 9.1 step 9): `initialUser` / `initialProfile`
 * props, a `SeedContext` the (app) and (play) layouts feed through `ViewerSeed` so
 * `useAuth()` starts with the server user and `loading: false`, `refreshProfile()` and
 * `applyProfile()` for the profile forms, and the `cv:auth` DOM event that primitives fire
 * when they need the sheet.
 */

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  /**
   * Claim a leaderboard spot with nothing but a display name. Creates a real Supabase
   * session flagged `is_anonymous`, so RLS, `user_id` and the `handle_new_user` profile
   * trigger all keep working untouched; the player simply never sees a sign-up.
   */
  joinAsGuest: (displayName: string) => Promise<{ ok: boolean; error?: string }>;
  /** Re-fetches the profile through the provider (the gen bump happens inside). */
  refreshProfile: () => Promise<void>;
  /** Writes a fresher profile locally (a profile-edit result); bumps the gen first. */
  applyProfile: (profile: Profile) => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOut: async () => {},
  joinAsGuest: async () => ({ ok: false }),
  refreshProfile: async () => {},
  applyProfile: () => {},
});

export interface SeedState {
  /** True once a layout has seeded the provider with the server viewer. */
  seeded: boolean;
  seed: (user: User | null, profile: Profile | null) => void;
}

export const SeedContext = createContext<SeedState>({ seeded: false, seed: () => {} });

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

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

function mapProfile(row: ProfileRow): Profile {
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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!data) return null;
  return mapProfile(data as ProfileRow);
}

export interface AuthProviderProps {
  children: ReactNode;
  /** The server-resolved user; `undefined` means "unknown until getUser resolves". */
  initialUser?: User | null;
  initialProfile?: Profile | null;
}

export function AuthProvider({ children, initialUser, initialProfile }: AuthProviderProps) {
  const seededByProps = initialUser !== undefined;
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [loading, setLoading] = useState(!seededByProps);
  const [seeded, setSeeded] = useState(seededByProps);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const callbackRef = useRef<(() => void | Promise<void>) | null>(null);
  // Mirrors `user` so openAuthModal can read the live value without being re-created on
  // every sign-in (its identity is a dep in the boards). Written only from effects/handlers.
  const userRef = useRef<User | null>(initialUser ?? null);
  // Bumped whenever a fresher profile is written locally (guest rename, edit form, seed);
  // a background fetch that started before the bump must not overwrite it.
  const profileGenRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();

    // If the auth check hangs, proceed as unauthenticated after 3 s.
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth
      .getUser()
      .then(async ({ data: { user: u } }) => {
        if (u) {
          userRef.current = u;
          setUser(u);
          const gen = profileGenRef.current;
          const p = await fetchProfile(u.id);
          if (gen === profileGenRef.current) setProfile(p);
        }
      })
      .catch(() => {
        // The auth check failed: proceed as unauthenticated.
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      userRef.current = u;
      setUser(u);
      setLoading(false);

      if (!u) {
        setProfile(null);
        void clearPersistedSession();
        return;
      }

      // Supabase holds its auth lock while this callback runs (INITIAL_SESSION in
      // particular): any supabase call awaited in here deadlocks and the profile never
      // loads. Defer all follow-up work to the next tick.
      setTimeout(() => {
        void (async () => {
          const gen = profileGenRef.current;
          const p = await fetchProfile(u.id);
          if (gen === profileGenRef.current) setProfile(p);

          // Native shell only: mirror the session to secure storage so it survives a
          // WKWebView cookie purge (no-op on the website).
          void persistSession();

          // PASSWORD_RECOVERY means the user is mid-reset on /auth/reset-password. Don't
          // run the post-sign-in callback or close the sheet: the reset page handles it.
          if (event === "PASSWORD_RECOVERY") return;

          if (callbackRef.current) {
            try {
              await callbackRef.current();
            } catch {
              // The callback failed: don't block the close.
            }
            callbackRef.current = null;
          }
          setAuthModalOpen(false);
        })();
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    // Already signed in, including via a guest session: run the callback straight away
    // rather than demanding credentials we do not need.
    if (userRef.current) {
      void onSuccess?.();
      return;
    }
    callbackRef.current = onSuccess ?? null;
    setAuthModalOpen(true);
  }, []);

  // Primitives never import the provider; they dispatch the DOM event instead.
  useEffect(() => {
    const onAuthRequest = () => openAuthModal();
    window.addEventListener(AUTH_EVENT, onAuthRequest);
    return () => window.removeEventListener(AUTH_EVENT, onAuthRequest);
  }, [openAuthModal]);

  const joinAsGuest = useCallback(async (displayName: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user) {
      // Set the ref synchronously. The `user` STATE only lands once the onAuthStateChange
      // listener re-renders, and the caller invokes onJoined -> openAuthModal on the very
      // next line; without this the short-circuit would still see null.
      userRef.current = data.user;
    }
    if (error) {
      // The likeliest cause is the Anonymous provider being off in the Supabase dashboard.
      return {
        ok: false,
        error: /anonymous/i.test(error.message) ? "Guest play is not enabled yet. Try signing in instead." : error.message,
      };
    }
    // The handle_new_user trigger already created a profile with a random geo handle;
    // overwrite the display name with what the player typed. Rename through the browser
    // client (RLS: own row), not a server action: one round trip, and not lost if the
    // player navigates away a moment later.
    const name = displayName.trim();
    if (name.length < 1 || name.length > 30) return { ok: false, error: "Pick a name between 1 and 30 characters" };
    if (!isAllowedHandle(name)) return { ok: false, error: "That name isn't allowed" };
    const uid = data.user!.id;
    const { data: row, error: upErr } = await supabase
      .from("profiles")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", uid)
      .select("*")
      .single();
    if (upErr) {
      // The session exists and the run will save; keep the name attempt in the background.
      void updateProfile({ displayName: name, countryCode: null }).then((r) => {
        if (r.success && r.profile) {
          profileGenRef.current++;
          setProfile(r.profile);
        }
      });
      return { ok: true };
    }
    if (row) {
      profileGenRef.current++;
      setProfile(mapProfile(row as ProfileRow));
    }
    return { ok: true };
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    callbackRef.current = null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await clearPersistedSession();
    await supabase.auth.signOut();
    userRef.current = null;
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    const gen = ++profileGenRef.current;
    const p = await fetchProfile(u.id);
    if (gen === profileGenRef.current) setProfile(p);
  }, []);

  const applyProfile = useCallback((p: Profile) => {
    profileGenRef.current++;
    setProfile(p);
  }, []);

  // The server viewer, handed in by ViewerSeed from a dynamic layout: the provider starts
  // (or continues) with the server user, and a stale in-flight fetch cannot overwrite it.
  const seed = useCallback((u: User | null, p: Profile | null) => {
    userRef.current = u;
    profileGenRef.current++;
    setUser(u);
    setProfile(p);
    setLoading(false);
    setSeeded(true);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, profile, loading, authModalOpen, openAuthModal, closeAuthModal, signOut, joinAsGuest, refreshProfile, applyProfile }),
    [user, profile, loading, authModalOpen, openAuthModal, closeAuthModal, signOut, joinAsGuest, refreshProfile, applyProfile],
  );
  const seedValue = useMemo<SeedState>(() => ({ seeded, seed }), [seeded, seed]);

  return (
    <SeedContext value={seedValue}>
      <AuthContext value={value}>{children}</AuthContext>
    </SeedContext>
  );
}
