"use client";

import { requestAuth } from "@/ui/types";

export interface SignedOutProps {
  /** What the page holds once there is an account, in the K3 voice. */
  line: string;
  /** Which surface asked, for the sheet's own copy. */
  reason: string;
}

/**
 * A visible destination never bounces (design law: dead controls). Friends and You are in
 * the tab bar for everyone, so signed out they render the page frame and one honest line
 * with the only action that changes anything.
 */
export function SignedOut({ line, reason }: SignedOutProps) {
  return (
    <div className="signed-out">
      <p className="t-body">{line}</p>
      <button type="button" className="act" onClick={() => requestAuth(reason)}>
        Sign in
      </button>
    </div>
  );
}
