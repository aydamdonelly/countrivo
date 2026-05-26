"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Status = "checking" | "ready" | "invalid" | "loading" | "success" | "error";

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  // Verify we have an active recovery session. Supabase sets one when the user
  // clicks the link from the recovery email (PKCE flow handled by the callback,
  // hash-based recovery flow auto-detected by the SDK).
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function check() {
      // Wait a tick for the SDK to parse any hash/PKCE params from the URL
      await new Promise((r) => setTimeout(r, 100));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setStatus("ready");
        requestAnimationFrame(() => passwordRef.current?.focus());
      } else {
        // Listen for PASSWORD_RECOVERY in case the hash parsing finishes late
        const timeout = setTimeout(() => {
          if (!cancelled) setStatus("invalid");
        }, 2000);
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            clearTimeout(timeout);
            sub.subscription.unsubscribe();
            if (!cancelled) {
              setStatus("ready");
              requestAnimationFrame(() => passwordRef.current?.focus());
            }
          }
        });
        return () => {
          clearTimeout(timeout);
          sub.subscription.unsubscribe();
        };
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/"), 1200);
  }

  if (status === "checking") {
    return (
      <div className="text-center py-6 text-sm text-cream-muted" role="status">
        Verifying your reset link...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="text-center py-3" role="alert">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-incorrect-light flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-incorrect" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-bold">Link expired or invalid</p>
        <p className="text-sm text-cream-muted mt-1.5 leading-relaxed">
          Reset links expire after a short time. Request a new one.
        </p>
        <a
          href="/auth/forgot-password"
          className="cta-primary w-full text-sm mt-5"
        >
          Request new link
        </a>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-3" role="status">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-correct-light flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-correct" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-bold">Password updated</p>
        <p className="text-sm text-cream-muted mt-1.5">Redirecting you home...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Hidden username for password managers */}
      <input type="email" name="email" autoComplete="username" hidden readOnly />

      <label htmlFor="new-password" className="sr-only">New password</label>
      <div className="relative">
        <input
          id="new-password"
          ref={passwordRef}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          enterKeyHint="next"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 chars)"
          required
          minLength={8}
          aria-describedby="reset-pw-hint"
          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-white text-sm
            focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
            placeholder:text-cream-muted/50"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-cream-muted hover:text-cream hover:bg-cream-ghost"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      <p id="reset-pw-hint" className="text-[11px] text-cream-muted -mt-1">
        At least 8 characters. Anything goes.
      </p>

      <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
      <input
        id="confirm-password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        enterKeyHint="go"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        required
        minLength={8}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm
          focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
          placeholder:text-cream-muted/50"
      />

      {errorMsg && (
        <p className="text-xs text-incorrect" role="alert">{errorMsg}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={status === "loading"}
        disabled={password.length < 8 || password !== confirm}
      >
        {status === "loading" ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
