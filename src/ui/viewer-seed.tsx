"use client";

import { useContext, useLayoutEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/server";
import { AuthContext, SeedContext } from "@/features/auth/auth-provider";

export interface ViewerSeedProps {
  user: User | null;
  profile: Profile | null;
  /** The chrome and page that should see the seeded viewer from their first render. */
  children?: ReactNode;
}

/**
 * Seeds the auth provider with the server-resolved viewer (blueprint 9.1 step 9) so
 * `useAuth()` starts with `loading: false` and the server user. Two halves:
 *
 * - Until the provider has been seeded, the children (the layout's chrome and page) read
 *   the server values through an overlaid context, identically on the server and on the
 *   first client render, so nothing flips after hydration.
 * - A layout effect (runs before the provider's own effects and before paint) hands the
 *   values to the provider: `userRef`, the profile (gen-bumped) and `loading: false`.
 *
 * Once seeded, the live provider state is what the children see, so a sign-in or sign-out
 * on the client is reflected at once.
 */
export function ViewerSeed({ user, profile, children }: ViewerSeedProps) {
  const live = useContext(AuthContext);
  const { seeded, seed } = useContext(SeedContext);

  useLayoutEffect(() => {
    seed(user, profile);
  }, [seed, user, profile]);

  if (children === undefined) return null;
  const value = seeded ? live : { ...live, user, profile, loading: false };
  return <AuthContext value={value}>{children}</AuthContext>;
}
