"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasNativeApple, nativeAppleSignIn } from "@/lib/native/apple-auth";
import { AuthSheet, classifyAuthError, type AuthErrorKind } from "@/ui/auth-sheet";
import { useAuth } from "./auth-provider";

/*
 * The one AuthSheet of the site, mounted in the root layout and driven by the provider's
 * `authModalOpen`. The submit flows are the old modal's (understand.json native.auth):
 * signInWithPassword, signUp (email confirmation is off, so signUp returns a session at
 * once), Sign in with Apple under Capacitor only, `auth_last_email` remembered in
 * localStorage. The sheet never closes itself on success: the provider does, on the auth
 * event.
 */

const LAST_EMAIL_KEY = "auth_last_email";

function readLastEmail(): string {
  try {
    return window.localStorage.getItem(LAST_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberEmail(email: string): void {
  try {
    window.localStorage.setItem(LAST_EMAIL_KEY, email);
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

function subscribeStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function serverEmail(): string {
  return "";
}

function isAppleCancel(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown } | null;
  const code = e && typeof e.code !== "undefined" ? String(e.code) : "";
  const msg = (e && typeof e.message === "string" ? e.message : String(err)).toLowerCase();
  return code === "1001" || msg.includes("cancel") || msg.includes("1001") || msg.includes("authorizationerror");
}

export function AuthSheetHost() {
  const { authModalOpen, closeAuthModal } = useAuth();
  // The remembered email, "" on the server and at hydration; re-read on every render.
  const lastEmail = useSyncExternalStore(subscribeStorage, readLastEmail, serverEmail);
  // False on the server and at hydration; the native driver registers after mount, and the
  // sheet opening re-renders this host, so an open sheet always sees the live value.
  const hasApple = hasNativeApple();

  const signIn = useCallback(async (email: string, password: string): Promise<AuthErrorKind | null> => {
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) return classifyAuthError(error.message);
    rememberEmail(email);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthErrorKind | null> => {
    const { error } = await createClient().auth.signUp({ email, password });
    if (error) return classifyAuthError(error.message);
    rememberEmail(email);
    return null;
  }, []);

  const apple = useCallback(async (): Promise<AuthErrorKind | null> => {
    const supabase = createClient();
    try {
      const { idToken, rawNonce, authorizationCode, profile } = await nativeAppleSignIn();
      // Apple embeds the HASHED nonce in the identity token; the RAW nonce goes to Supabase.
      const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: idToken, nonce: rawNonce });
      if (error) return classifyAuthError(error.message);
      if (authorizationCode) {
        // Best effort: stores an Apple refresh token so delete-account can revoke it.
        void supabase.functions.invoke("apple-exchange", { body: { authorizationCode } }).catch(() => {});
      }
      // Apple sends the name on the first authorisation only; keep it while we have it.
      const fullName = [profile?.givenName, profile?.familyName].filter((s): s is string => Boolean(s)).join(" ");
      if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
      return null;
    } catch (err) {
      return isAppleCancel(err) ? null : "generic";
    }
  }, []);

  return (
    <AuthSheet
      open={authModalOpen}
      onClose={closeAuthModal}
      onSignIn={signIn}
      onSignUp={signUp}
      onApple={hasApple ? apple : undefined}
      hasApple={hasApple}
      initialEmail={lastEmail}
    />
  );
}
