"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendFriendRequest } from "@/app/actions/friends";
import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/ui/button";

/**
 * The confirm control of `/friends/add/[username]` (blueprint 7.15). The request is sent on
 * CLICK, never as a side effect of the GET, and the row reports what happened in place.
 */
export function AddFriendButton({ profileId, name }: { profileId: string; name: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setState("sending");
    const res = await sendFriendRequest(profileId).catch(() => ({ success: false }));
    setState(res.success ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <>
        <p className="ask t-body">Request sent. {name} will see it.</p>
        <div className="acts">
          <Button variant="text" href="/friends">
            Go to friends
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="ask t-body">Add {name}?</p>
      <div className="acts">
        <Button onClick={() => void send()} disabled={state === "sending"} pending={state === "sending"} pendingLabel="Sending">
          Send request
        </Button>
        <Button variant="text" href="/friends">
          Cancel
        </Button>
      </div>
      {state === "error" ? <p className="err t-meta">Could not send. Try again.</p> : null}
    </>
  );
}

/**
 * The signed-out state of the same page (blueprint 7.15): the sheet opens on click and the
 * provider's success callback refreshes the route, so the real Send request control takes
 * its place with the session in hand.
 */
export function SignInToAdd({ name }: { name: string }) {
  const router = useRouter();
  const { openAuthModal } = useAuth();
  return (
    <div className="acts">
      <Button onClick={() => openAuthModal(() => router.refresh())}>Sign in to add {name}</Button>
    </div>
  );
}
