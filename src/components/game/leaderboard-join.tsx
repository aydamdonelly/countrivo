"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

interface LeaderboardJoinProps {
  /** Runs once a session exists — the board's own submitGameRun path. */
  onJoined: () => void;
  /** Daily runs land on a ranked board; practice runs only save to the profile. */
  daily: boolean;
}

const MAX_NAME = 30;

/**
 * The whole barrier between finishing a run and being on the leaderboard: one
 * name field. No email, no password, no confirmation step.
 *
 * Signing in still exists for players who want a streak that follows them
 * across devices, but it is a secondary link here, never a gate.
 */
export function LeaderboardJoin({ onJoined, daily }: LeaderboardJoinProps) {
  const { joinAsGuest, openAuthModal } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name first");
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    const res = await joinAsGuest(trimmed);
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? "Could not join — try again");
      return;
    }
    onJoined();
  }, [name, joinAsGuest, onJoined]);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-bold text-cream text-center">
        {daily ? "Get on the leaderboard" : "Save this result"}
      </p>
      <p className="text-xs text-cream-muted text-center mt-0.5">
        Just pick a name — no account needed.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, MAX_NAME));
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={busy}
          placeholder="Your name"
          aria-label="Your leaderboard name"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_NAME}
          className={cn(
            "flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 bg-surface-sunken text-cream",
            "placeholder:text-cream-muted/50 focus:outline-none focus:border-gold transition-colors",
            "disabled:opacity-60",
            error ? "border-incorrect" : "border-border",
          )}
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="cta-primary shrink-0 px-5 disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-incorrect text-center" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => openAuthModal(onJoined)}
        className="mt-3 w-full text-xs text-cream-muted underline underline-offset-2 hover:text-cream transition-colors"
      >
        Or sign in to keep your streak across devices
      </button>
    </div>
  );
}
