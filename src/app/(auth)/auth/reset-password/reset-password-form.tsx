"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { AUTH_ERROR_COPY, classifyAuthError } from "@/ui/auth-sheet";

type Status = "ready" | "invalid" | "saving" | "done";

/**
 * Set a new password (blueprint 7.17, auth contract). The form is on screen from the first
 * frame and never waits behind a check: the recovery session is verified in the background,
 * and only a link that never produces one swaps the form for the expired state.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("ready");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let timeout = 0;
    let unsubscribe: (() => void) | null = null;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session) return;
      const sub = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          window.clearTimeout(timeout);
          sub.data.subscription.unsubscribe();
        }
      });
      unsubscribe = () => sub.data.subscription.unsubscribe();
      timeout = window.setTimeout(() => {
        if (!cancelled) setStatus((s) => (s === "ready" ? "invalid" : s));
      }, 2000);
    }

    void check();
    first.current?.focus();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setStatus("ready");
      /* The auth contract's taxonomy, never Supabase's raw sentence: a leaked
         "AuthApiError: New password should be different..." is not our voice. */
      setError(AUTH_ERROR_COPY[classifyAuthError(err.message)]);
      return;
    }
    setStatus("done");
    window.setTimeout(() => router.push("/"), 1200);
  }

  if (status === "invalid") {
    return (
      <div className="stack" role="alert">
        <p className="head t-list">Link expired or invalid</p>
        <p className="done t-body">Reset links last a short while. Ask for a new one.</p>
        <Button href="/auth/forgot-password" block>
          Request new link
        </Button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="stack" role="status">
        <p className="head t-list">Password updated</p>
        <p className="done t-body">Taking you home.</p>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="lead t-body">Choose something at least 8 characters long.</p>
      {/* password managers want a username field beside a new password */}
      <input type="email" name="email" autoComplete="username" hidden readOnly />
      <div className="pw">
        <Field
          id="new-password"
          ref={first}
          label="New password"
          hideLabel
          type={show ? "text" : "password"}
          autoComplete="new-password"
          enterKeyHint="next"
          placeholder="New password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters. Anything goes."
        />
        <Button variant="text" className="show" tabIndex={-1} aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
          {show ? "Hide" : "Show"}
        </Button>
      </div>
      <Field
        id="confirm-password"
        label="Confirm password"
        hideLabel
        type={show ? "text" : "password"}
        autoComplete="new-password"
        enterKeyHint="go"
        placeholder="Confirm new password"
        minLength={8}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error ? (
        <p className="err t-meta" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" block disabled={password.length < 8 || password !== confirm || status === "saving"} pending={status === "saving"} pendingLabel="Updating">
        Update password
      </Button>
    </form>
  );
}
