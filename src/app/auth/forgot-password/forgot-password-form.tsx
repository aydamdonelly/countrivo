"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Treat all responses as success to avoid email enumeration leaks.
    // Only show error on transport-level failures (network/rate limit).
    if (error && (error.message.includes("rate limit") || error.message.includes("network"))) {
      setStatus("error");
      setErrorMsg(error.message.includes("rate limit")
        ? "Too many attempts. Wait a minute and try again."
        : "Connection lost. Try again.");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center py-3" role="status">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-dim flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <p className="font-bold">Check your email</p>
        <p className="text-sm text-cream-muted mt-1.5 leading-relaxed">
          If an account exists for <span className="font-medium text-cream">{email}</span>,
          you&apos;ll get a reset link within a minute.
        </p>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setEmail(""); setErrorMsg(""); }}
          className="mt-5 text-xs text-gold font-medium hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="reset-email" className="sr-only">Email address</label>
      <input
        id="reset-email"
        ref={emailRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="send"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        aria-describedby={errorMsg ? "reset-error" : undefined}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm
          focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
          placeholder:text-cream-muted/50"
      />
      {errorMsg && (
        <p id="reset-error" className="text-xs text-incorrect" role="alert">
          {errorMsg}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="cta-primary w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
