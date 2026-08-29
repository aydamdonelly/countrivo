"use client";

import { useState, useTransition, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

export interface JoinRowProps {
  /** Daily: "Get on the board"; practice: "Save this result". */
  daily: boolean;
  /** The auth contract's joinAsGuest. */
  onJoin: (name: string) => Promise<{ ok: boolean; error?: string }>;
  /** Called after a successful join (the host submits the run). */
  onJoined: () => void;
  /** Opens the auth sheet with onSuccess = onJoined. */
  onSignIn: () => void;
  className?: string;
}

/**
 * The guest join row (blueprint 3.25): card fill, radius 12, padding 16, a name field
 * and an ink Join button (pending "Joining"), then the text button to sign in instead.
 */
export function JoinRow({ daily, onJoin, onJoined, onSignIn, className }: JoinRowProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name first");
      return;
    }
    start(async () => {
      const res = await onJoin(trimmed);
      if (res.ok) {
        setError(null);
        onJoined();
      } else {
        setError(res.error ?? "Could not join. Try again.");
      }
    });
  }

  return (
    <section className={cn("join", className)}>
      <h3 className="t-row">{daily ? "Get on the board" : "Save this result"}</h3>
      <p className="sub t-meta">Pick a name, no account needed.</p>
      <form onSubmit={submit}>
        <Field id="join-name" label="Your name" hideLabel placeholder="Your name" maxLength={30} autoCapitalize="words" enterKeyHint="go" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        <Button type="submit" variant="ink" pending={pending} pendingLabel="Joining">
          Join
        </Button>
      </form>
      {error ? (
        <p className="err t-meta" role="alert">
          {error}
        </p>
      ) : null}
      <div className="alt">
        <Button variant="text" onClick={onSignIn}>
          Or sign in to keep your streak across devices
        </Button>
      </div>
    </section>
  );
}
