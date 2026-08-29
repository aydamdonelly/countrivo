"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/ui/sheet";
import { Field } from "@/ui/field";
import { Button } from "@/ui/button";

export type AuthTab = "signin" | "signup";

/** The auth contract's error taxonomy (understand.json native.auth). */
export type AuthErrorKind = "invalid_credentials" | "user_already_exists" | "weak_password" | "rate_limit" | "network" | "generic";

export const AUTH_ERROR_COPY: Record<AuthErrorKind, string> = {
  invalid_credentials: "Wrong email or password. Try again or reset your password.",
  user_already_exists: "You already have an account. Switch to Sign in.",
  weak_password: "Password must be at least 8 characters.",
  rate_limit: "Too many attempts. Wait a moment and try again.",
  network: "Connection lost. Try again.",
  generic: "Something went wrong. Try again.",
};

/** Maps a Supabase error message onto the taxonomy, exactly as the old modal did. */
export function classifyAuthError(message: string): AuthErrorKind {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) return "invalid_credentials";
  if (m.includes("already registered") || m.includes("user_already_exists")) return "user_already_exists";
  if (m.includes("password should be") || m.includes("weak_password") || m.includes("at least")) return "weak_password";
  if (m.includes("rate limit") || m.includes("over_request_rate")) return "rate_limit";
  if (m.includes("network") || m.includes("fetch")) return "network";
  return "generic";
}

export interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  /** Resolve null on success; the provider closes the sheet on the auth event. */
  onSignIn: (email: string, password: string) => Promise<AuthErrorKind | null>;
  onSignUp: (email: string, password: string) => Promise<AuthErrorKind | null>;
  /** Only under Capacitor (hasNativeApple()). */
  onApple?: () => Promise<AuthErrorKind | null>;
  hasApple?: boolean;
  forgotHref?: string;
  /** localStorage auth_last_email, restored by the caller. */
  initialEmail?: string;
  initialTab?: AuthTab;
}

const APPLE_PATH =
  "M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z";

/**
 * The auth modal's behaviour inside a Sheet (blueprint 3.31): two text tabs with the
 * K3 word underline, email and password fields, show/hide, caps lock, the taxonomy's
 * error copy verbatim, an ink block submit with pending labels, Forgot password, the
 * Apple button under Capacitor only, and Continue as guest. The sheet never closes
 * itself on success.
 */
export function AuthSheet({ open, onClose, onSignIn, onSignUp, onApple, hasApple, forgotHref = "/auth/forgot-password", initialEmail = "", initialTab = "signin" }: AuthSheetProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);

  useEffect(() => {
    if (open) return;
    setTab(initialTab);
    setPassword("");
    setShow(false);
    setCaps(false);
    setSubmitting(false);
    setError(null);
  }, [open, initialTab]);

  useEffect(() => {
    if (open && initialEmail && !email) setEmail(initialEmail);
    // Only restore the remembered email when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const signup = tab === "signup";
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const trimmed = email.trim().toLowerCase();
    if (signup && password.length < 8) {
      setError("weak_password");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const kind = signup ? await onSignUp(trimmed, password) : await onSignIn(trimmed, password);
      if (kind) setError(kind);
    } catch {
      setError("network");
    } finally {
      setSubmitting(false);
    }
  }

  async function apple() {
    if (!onApple) return;
    setSubmitting(true);
    setError(null);
    try {
      const kind = await onApple();
      if (kind) setError(kind);
    } finally {
      setSubmitting(false);
    }
  }

  function capsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCaps(e.getModifierState("CapsLock"));
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="auth-title">
      <div className="auth">
        <h2 id="auth-title" className="t-h2">
          {signup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="sub t-body">{signup ? "Scores, a streak, the board with your friends." : "Sign in to keep your scores and your streak."}</p>
        <div className="tabs t-body" role="tablist" aria-label="Sign in or sign up">
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(null); }}>
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          <Field
            id="auth-email"
            label="Email"
            hideLabel
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-autofocus
          />
          <div className="pw">
            <Field
              id="auth-password"
              label="Password"
              hideLabel
              type={show ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              enterKeyHint="go"
              placeholder={signup ? "Choose a password (min 8 chars)" : "Password"}
              minLength={signup ? 8 : undefined}
              aria-describedby={signup ? "auth-pw-hint" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={capsLock}
              onKeyUp={capsLock}
            />
            <Button variant="text" className="show" tabIndex={-1} aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
              {show ? "Hide" : "Show"}
            </Button>
          </div>
          {caps ? (
            <p className="caps t-meta" role="status">
              Caps Lock is on
            </p>
          ) : null}
          {signup ? (
            <p id="auth-pw-hint" className="hint t-meta">
              At least 8 characters. Anything goes.
            </p>
          ) : null}
          {error ? (
            <p className="err t-meta" role="alert" aria-live="polite">
              {AUTH_ERROR_COPY[error]}
            </p>
          ) : null}
          <div className="actions">
            <Button type="submit" variant="ink" block disabled={!canSubmit} pending={submitting} pendingLabel={signup ? "Creating account" : "Signing in"}>
              {signup ? "Create account" : "Sign in"}
            </Button>
            {!signup ? (
              <Button variant="text" href={forgotHref} onClick={onClose} className="forgot">
                Forgot password?
              </Button>
            ) : null}
            {hasApple && onApple ? (
              <Button variant="ink" block onClick={apple} disabled={submitting} className={cn("apple")}>
                <svg viewBox="0 0 384 512" width="15" height="18" fill="currentColor" aria-hidden="true">
                  <path d={APPLE_PATH} />
                </svg>
                Sign in with Apple
              </Button>
            ) : null}
            <Button variant="quiet" block onClick={onClose}>
              Continue as guest
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
