"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";
import { hasNativeApple, nativeAppleSignIn } from "@/lib/native/apple-auth";
import { Button } from "@/components/ui/button";

type Tab = "signin" | "signup";
type SignInError =
  | "invalid_credentials"
  | "user_already_exists"
  | "weak_password"
  | "rate_limit"
  | "network"
  | "generic";

function classifyError(message: string): SignInError {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) return "invalid_credentials";
  if (m.includes("already registered") || m.includes("user_already_exists")) return "user_already_exists";
  if (m.includes("password should be") || m.includes("weak_password") || m.includes("at least")) return "weak_password";
  if (m.includes("rate limit") || m.includes("over_request_rate")) return "rate_limit";
  if (m.includes("network") || m.includes("fetch")) return "network";
  return "generic";
}

function errorCopy(kind: SignInError): string {
  switch (kind) {
    case "invalid_credentials":
      return "Wrong email or password. Try again or reset your password.";
    case "user_already_exists":
      return "You already have an account. Switch to Sign In.";
    case "weak_password":
      return "Password must be at least 8 characters.";
    case "rate_limit":
      return "Too many attempts. Wait a moment and try again.";
    case "network":
      return "Connection lost. Try again.";
    case "generic":
      return "Something went wrong. Try again.";
  }
}

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<SignInError | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset transient state whenever the modal closes
  useEffect(() => {
    if (!authModalOpen) {
      setTab("signin");
      setPassword("");
      setShowPassword(false);
      setCapsLockOn(false);
      setSubmitting(false);
      setErrorKind(null);
    }
  }, [authModalOpen]);

  // Focus trap, escape key, autofocus email
  useEffect(() => {
    if (!authModalOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      emailRef.current?.focus();
      // Restore last-used email for returning users
      try {
        const last = localStorage.getItem("auth_last_email");
        if (last && !email) setEmail(last);
      } catch {
        // localStorage may be unavailable (private mode)
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authModalOpen, closeAuthModal]);

  // Caps-lock detection on password fields
  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password || submitting) return;

    if (tab === "signup" && password.length < 8) {
      setErrorKind("weak_password");
      return;
    }

    setSubmitting(true);
    setErrorKind(null);

    const supabase = createClient();
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorKind(classifyError(error.message));
          setSubmitting(false);
          return;
        }
        // success -> auth-provider closes the modal via onAuthStateChange
        try { localStorage.setItem("auth_last_email", trimmedEmail); } catch {}
      } else {
        // Email confirmation is disabled, so signUp returns a session
        // immediately and the user is signed in — no verification step.
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorKind(classifyError(error.message));
          setSubmitting(false);
          return;
        }
        try { localStorage.setItem("auth_last_email", trimmedEmail); } catch {}
        // Signed in -> auth-provider closes the modal via onAuthStateChange.
      }
    } catch {
      setErrorKind("network");
      setSubmitting(false);
    }
  };

  // Native iOS only: Sign in with Apple via the native sheet → Supabase idToken.
  const signInWithApple = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorKind(null);
    try {
      const { idToken, rawNonce, authorizationCode, profile } = await nativeAppleSignIn();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
        nonce: rawNonce,
      });
      if (error) {
        setErrorKind(classifyError(error.message));
        setSubmitting(false);
        return;
      }
      // Store the Apple authorization code server-side so account deletion can
      // revoke the token (Guideline 5.1.1(v)). Best-effort; never blocks sign-in.
      if (authorizationCode) {
        supabase.functions
          .invoke("apple-exchange", { body: { authorizationCode } })
          .catch(() => {});
      }
      // Apple returns the name only on the FIRST authorization — persist it now.
      const fullName = [profile?.givenName, profile?.familyName].filter(Boolean).join(" ");
      if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
      // auth-provider closes the modal via onAuthStateChange.
    } catch (err) {
      // A user-cancelled Apple sheet is not an error — reset quietly. Anything
      // else shows a neutral message (not the misleading "Connection lost").
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const code = (err as { code?: string })?.code;
      const cancelled =
        code === "1001" || msg.includes("cancel") || msg.includes("1001") || msg.includes("authorizationerror");
      setErrorKind(cancelled ? null : "generic");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-surface w-full sm:max-w-sm
          rounded-t-2xl sm:rounded-2xl shadow-xl
          p-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] sm:pb-6
          max-h-[92vh] overflow-y-auto
          animate-slide-up sm:animate-scale-in"
      >
        {/* Grabber — native bottom-sheet affordance (mobile only) */}
        <div aria-hidden className="sm:hidden mx-auto -mt-3 mb-3 h-1.5 w-10 rounded-full bg-cream-dim" />
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-lg text-cream-muted/60 hover:text-cream hover:bg-cream-ghost transition-colors active:scale-[0.97]"
          aria-label="Close sign-in dialog"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 id="auth-modal-title" className="text-xl font-extrabold">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-cream-muted mt-1">
            {tab === "signin"
              ? "Sign in to save your scores and keep your streak alive."
              : "Save your scores, build a daily streak, climb the leaderboards."}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          role="tablist"
          aria-label="Sign in or sign up"
          className="flex p-1 mb-5 bg-cream-ghost rounded-xl"
        >
          <button
            role="tab"
            aria-selected={tab === "signin"}
            onClick={() => { setTab("signin"); setErrorKind(null); }}
            className={`flex-1 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all ${
              tab === "signin"
                ? "bg-surface shadow-sm text-cream"
                : "text-cream-muted hover:text-cream"
            }`}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => { setTab("signup"); setErrorKind(null); }}
            className={`flex-1 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all ${
              tab === "signup"
                ? "bg-surface shadow-sm text-cream"
                : "text-cream-muted hover:text-cream"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Native iOS: Sign in with Apple (black on light theme / white on dark — both HIG-valid).
            Rendered only in the native shell; the website is unaffected. */}
        {hasNativeApple() && (
          <div className="flex flex-col gap-3 mb-3">
            <button
              type="button"
              onClick={() => { void signInWithApple(); }}
              disabled={submitting}
              className="w-full min-h-13 flex items-center justify-center gap-2 rounded-xl bg-cream text-bg font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <svg viewBox="0 0 384 512" width="15" height="18" fill="currentColor" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Sign in with Apple
            </button>
            <div className="flex items-center gap-3 text-xxs text-cream-muted">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <label htmlFor="auth-email" className="sr-only">Email address</label>
          <input
            id="auth-email"
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            aria-label="Email address"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm
              focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20
              placeholder:text-cream-muted/50"
          />

          <label htmlFor="auth-password" className="sr-only">Password</label>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKey}
              onKeyUp={handlePasswordKey}
              onFocus={(e) => setCapsLockOn(e.target.value.length === 0 ? false : capsLockOn)}
              placeholder={tab === "signin" ? "Password" : "Choose a password (min 8 chars)"}
              required
              minLength={tab === "signup" ? 8 : undefined}
              aria-label="Password"
              aria-describedby={tab === "signup" ? "auth-pw-hint" : undefined}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-surface text-sm
                focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20
                placeholder:text-cream-muted/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-md text-cream-muted hover:text-cream hover:bg-cream-ghost transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {tab === "signup" && (
            <p id="auth-pw-hint" className="text-xxs text-cream-muted -mt-1">
              At least 8 characters. Anything goes.
            </p>
          )}

          {capsLockOn && (
            <p className="text-xxs text-gold font-medium" role="status">
              Caps Lock is on
            </p>
          )}

          {errorKind && (
            <p className="text-xs text-incorrect" role="alert" aria-live="polite">
              {errorCopy(errorKind)}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={submitting}
            disabled={!email.trim() || !password}
            className="mt-1"
          >
            {submitting
              ? (tab === "signin" ? "Signing in..." : "Creating account...")
              : (tab === "signin" ? "Sign In" : "Create Account")}
          </Button>

          {tab === "signin" && (
            <div className="text-center mt-1">
              <Link
                href="/auth/forgot-password"
                onClick={closeAuthModal}
                className="text-xs text-gold font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </form>

        {/* Guest dismiss — kept per Adam's brief */}
        <button
          onClick={closeAuthModal}
          className="w-full mt-4 py-3 min-h-[44px] text-center text-xs text-cream-muted hover:text-cream transition-colors"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
