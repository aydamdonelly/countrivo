"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Tab = "signin" | "signup";
type SignInError =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_already_exists"
  | "weak_password"
  | "rate_limit"
  | "network"
  | "generic";

function classifyError(message: string): SignInError {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) return "invalid_credentials";
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) return "email_not_confirmed";
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
    case "email_not_confirmed":
      return "Check your email and click the verification link to finish signing in.";
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
  const [verifySent, setVerifySent] = useState(false);

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
      setVerifySent(false);
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
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setErrorKind(classifyError(error.message));
          setSubmitting(false);
          return;
        }
        try { localStorage.setItem("auth_last_email", trimmedEmail); } catch {}
        // With email-confirm ON, signUp returns a user but no session.
        if (!data.session) {
          setVerifySent(true);
          setSubmitting(false);
          return;
        }
        // Auto-signed-in (confirm-email disabled): provider handles close.
      }
    } catch {
      setErrorKind("network");
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-white w-full sm:max-w-sm
          rounded-t-2xl sm:rounded-2xl shadow-xl
          p-6 pb-7 sm:pb-6
          max-h-[92vh] overflow-y-auto
          animate-slide-up sm:animate-scale-in"
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-cream-muted/60 hover:text-cream hover:bg-cream-ghost transition-colors"
          aria-label="Close sign-in dialog"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {verifySent ? (
          <VerifySentView email={email} onUseDifferent={() => { setVerifySent(false); setPassword(""); }} />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-5">
              <h2 id="auth-modal-title" className="text-xl font-extrabold">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-cream-muted mt-1">
                {tab === "signin"
                  ? "Sign in to save scores and track streaks."
                  : "Save scores, build streaks, climb leaderboards."}
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
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "signin"
                    ? "bg-white shadow-sm text-cream"
                    : "text-cream-muted hover:text-cream"
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={tab === "signup"}
                onClick={() => { setTab("signup"); setErrorKind(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "signup"
                    ? "bg-white shadow-sm text-cream"
                    : "text-cream-muted hover:text-cream"
                }`}
              >
                Sign Up
              </button>
            </div>

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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm
                  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
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
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-white text-sm
                    focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
                    placeholder:text-cream-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-cream-muted hover:text-cream hover:bg-cream-ghost transition-colors"
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
              className="w-full mt-4 text-center text-xs text-cream-muted hover:text-cream transition-colors"
            >
              Continue as guest
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function VerifySentView({ email, onUseDifferent }: { email: string; onUseDifferent: () => void }) {
  return (
    <div className="text-center py-4" role="status">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-dim flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <p className="font-bold">Check your email</p>
      <p className="text-sm text-cream-muted mt-1.5 leading-relaxed">
        We sent a verification link to <span className="font-medium text-cream">{email}</span>.
        Click it to start playing.
      </p>
      <button
        type="button"
        onClick={onUseDifferent}
        className="mt-5 text-xs text-gold font-medium hover:underline"
      >
        Use a different email
      </button>
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
