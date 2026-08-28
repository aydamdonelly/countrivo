"use client";

import { useState } from "react";
import Link from "next/link";
import { sendFriendRequest } from "@/app/actions/friends";

/**
 * Explicit confirm button — the friend request is sent on CLICK (a POST-like
 * server-action call), never as a side effect of rendering the page on GET.
 */
export function AddFriendButton({ profileId, name }: { profileId: string; name: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async () => {
    setState("sending");
    try {
      await sendFriendRequest(profileId);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <>
        <p className="text-lg font-bold">Friend request sent!</p>
        <p className="text-sm text-cream-muted mt-1">{name} will see your request.</p>
        <Link
          href="/friends"
          className="inline-block mt-6 px-6 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all"
        >
          Go to friends
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="text-lg font-bold">Add {name}?</p>
      <button
        type="button"
        onClick={() => { void send(); }}
        disabled={state === "sending"}
        className="mt-6 px-6 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send friend request"}
      </button>
      {state === "error" && (
        <p className="text-sm text-incorrect mt-3">Couldn&apos;t send. Please try again.</p>
      )}
      <div className="mt-4">
        <Link href="/friends" className="text-sm font-medium text-gold-ink hover:underline">Cancel</Link>
      </div>
    </>
  );
}
