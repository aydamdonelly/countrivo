"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap + escape key
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

    // Auto-focus first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
      } else {
        setStatus("sent");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        },
      });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in"
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-cream-muted hover:text-cream hover:bg-black/5 transition-colors"
          aria-label="Close sign-in dialog"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 id="auth-modal-title" className="text-xl font-extrabold">
            Sign in to Coun<span className="text-gold">trivo</span>
          </h2>
          <p className="text-sm text-cream-muted mt-1">
            Save your scores, track streaks, compete on leaderboards.
          </p>
        </div>

        {status === "sent" ? (
          <div className="text-center py-4" role="status">
            <div className="text-3xl mb-3" aria-hidden="true">📬</div>
            <p className="font-bold">Check your email</p>
            <p className="text-sm text-cream-muted mt-1">
              We sent a sign-in link to <span className="font-medium text-cream">{email}</span>
            </p>
            <button
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="mt-4 text-sm text-gold font-medium hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* OAuth buttons */}
            <div className="flex flex-col gap-2.5 mb-5">
              <button
                onClick={() => handleOAuth("google")}
                disabled={submitting}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl border border-border bg-white hover:bg-black/3 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuth("apple")}
                disabled={submitting}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl border border-border bg-white hover:bg-black/3 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
                  <path d="M13.718 9.554c-.022-2.236 1.827-3.31 1.91-3.362-1.04-1.52-2.66-1.728-3.235-1.752-1.377-.14-2.688.811-3.387.811-.697 0-1.776-.79-2.919-.769-1.502.022-2.887.873-3.662 2.217-1.562 2.71-.4 6.724 1.122 8.925.744 1.076 1.632 2.285 2.798 2.242 1.122-.045 1.546-.726 2.903-.726 1.357 0 1.736.726 2.919.703 1.208-.022 1.977-1.096 2.717-2.174.856-1.248 1.209-2.455 1.231-2.518-.027-.012-2.362-.907-2.397-3.597zM11.475 2.92C12.09 2.178 12.505 1.16 12.394.123c-.872.036-1.929.581-2.554 1.313-.562.65-1.053 1.688-.921 2.684.973.075 1.965-.494 2.556-1.2z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-cream-muted font-medium">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email magic link */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <label htmlFor="auth-email" className="sr-only">Email address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm
                  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
                  placeholder:text-cream-muted/50"
              />
              {errorMsg && (
                <p className="text-xs text-incorrect" role="alert">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="cta-primary w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          </>
        )}

        {/* Guest dismiss */}
        <button
          onClick={closeAuthModal}
          className="w-full mt-4 text-center text-xs text-cream-muted hover:text-cream transition-colors"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
