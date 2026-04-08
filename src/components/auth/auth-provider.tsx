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
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/server";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOut: async () => {},
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

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        const p = await fetchProfile(u.id);
        setProfile(p);
      }
    }).catch(() => {
      // Auth check failed — proceed as unauthenticated
    }).finally(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        const p = await fetchProfile(u.id);
        setProfile(p);

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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    callbackRef.current = onSuccess ?? null;
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    callbackRef.current = null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
    }}>
      {children}
    </AuthContext>
  );
}
