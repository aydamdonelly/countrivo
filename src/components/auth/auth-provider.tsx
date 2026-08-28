"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { persistSession, clearPersistedSession } from "@/lib/native/session-fallback";
import type { User } from "@supabase/supabase-js";
import { updateProfile } from "@/app/actions/profile";
import type { Profile } from "@/types/server";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  /**
   * Claim a leaderboard spot with nothing but a display name. Creates a real
   * Supabase session flagged `is_anonymous`, so RLS, `user_id` and the
   * `handle_new_user` profile trigger all keep working untouched — the player
   * simply never sees a sign-up.
   */
  joinAsGuest: (displayName: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOut: async () => {},
  joinAsGuest: async () => ({ ok: false }),
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    countryCode: data.country_code,
    streakCurrent: data.streak_current ?? 0,
    streakLongest: data.streak_longest ?? 0,
    lastDailyDate: data.last_daily_date,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);
  // Mirrors `user` so openAuthModal can read the live value without being
  // re-created on every sign-in (its identity is a dep in several boards).
  // Written only from effects/handlers — never during render.
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Timeout: if auth check hangs, proceed as unauthenticated after 3s
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        userRef.current = u;
        setUser(u);
        const p = await fetchProfile(u.id);
        setProfile(p);
      }
    }).catch(() => {
      // Auth check failed — proceed as unauthenticated
    }).finally(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      userRef.current = u;
      setUser(u);
      setLoading(false);

      if (u) {
        const p = await fetchProfile(u.id);
        setProfile(p);

        // Native shell only: mirror the session to secure storage so it survives
        // a WKWebView cookie purge (no-op on the website).
        void persistSession();

        // PASSWORD_RECOVERY means the user is mid-reset on /auth/reset-password.
        // Don't run the post-sign-in callback or close the modal — let the
        // reset page handle the flow.
        if (event === "PASSWORD_RECOVERY") return;

        if (callbackRef.current) {
          try {
            await callbackRef.current();
          } catch {
            // Callback failed — don't block modal close
          }
          callbackRef.current = null;
        }
        setAuthModalOpen(false);
      } else {
        setProfile(null);
        void clearPersistedSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    // Already signed in — including via a guest leaderboard session — so run
    // the callback straight away rather than demanding credentials we do not
    // need. This is what lets all 17 boards keep their existing
    // `openAuthModal(submit)` call unchanged.
    if (userRef.current) {
      void onSuccess?.();
      return;
    }
    callbackRef.current = onSuccess ?? null;
    setAuthModalOpen(true);
  }, []);

  const joinAsGuest = useCallback(
    async (displayName: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.user) {
        // Set the ref synchronously. The `user` STATE only lands once the
        // onAuthStateChange listener re-renders, and the caller invokes
        // onSaveScore -> openAuthModal on the very next line — without this the
        // short-circuit would still see null and pop the sign-in modal.
        userRef.current = data.user;
      }
      if (error) {
        // The most likely cause is the Anonymous provider being switched off in
        // the Supabase dashboard — say so plainly instead of "unknown error".
        return {
          ok: false,
          error: /anonymous/i.test(error.message)
            ? "Guest play is not enabled yet. Try signing in instead."
            : error.message,
        };
      }
      // The handle_new_user trigger already created a profile with a random
      // geo handle; overwrite the display name with what the player typed.
      const res = await updateProfile({ displayName, countryCode: null });
      if (!res.success) return { ok: false, error: res.error ?? "Could not save that name" };
      // Show the chosen name in the header right away instead of waiting for the next refetch.
      if (res.profile) setProfile(res.profile);
      return { ok: true };
    },
    [],
  );

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

  return (
    <AuthContext value={{
      user,
      profile,
      loading,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      signOut,
      joinAsGuest,
    }}>
      {children}
    </AuthContext>
  );
}
