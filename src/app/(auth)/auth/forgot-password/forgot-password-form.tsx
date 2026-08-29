"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

/**
 * Request a reset link (blueprint 7.17, auth contract). Every answer reads as sent, so the
 * form never tells anyone which addresses have an account; only a rate limit or a dead
 * connection says otherwise.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSending(false);
    if (err && (err.message.includes("rate limit") || err.message.includes("network"))) {
      setError(err.message.includes("rate limit") ? "Too many attempts. Wait a minute and try again." : "Connection lost. Try again.");
      return;
    }
    setSent(trimmed);
  }

  if (sent) {
    return (
      <div className="stack" role="status">
        <p className="head t-list">Check your email</p>
        <p className="done t-body">
          If an account exists for <b>{sent}</b>, you&apos;ll get a reset link within a minute.
        </p>
        <Button
          variant="text"
          className="act"
          onClick={() => {
            setSent(null);
            setEmail("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="lead t-body">Enter your email and we&apos;ll send you a reset link.</p>
      <Field
        id="reset-email"
        label="Email"
        hideLabel
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="send"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
      />
      {error ? (
        <p className="err t-meta" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" block disabled={!email.trim() || sending} pending={sending} pendingLabel="Sending">
        Send reset link
      </Button>
    </form>
  );
}
