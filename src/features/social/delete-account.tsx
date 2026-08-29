"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { SectionHead } from "@/ui/section-head";

/**
 * In-app account deletion (App Store 5.1.1(v), blueprint 7.16). Two steps, no dialog: the
 * first press swaps the row for the confirmation. The Edge function runs with the service
 * role and deletes only the caller.
 */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setDeleting(true);
    setFailed(false);
    const supabase = createClient();
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      setFailed(true);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <section className="sec danger">
      <SectionHead title="Delete account" />
      <p className="sub t-body">Permanently deletes your account, your scores and your streak. This cannot be undone.</p>
      <div className="acts">
        {confirming ? (
          <>
            <Button onClick={() => void remove()} disabled={deleting} pending={deleting} pendingLabel="Deleting">
              Yes, permanently delete
            </Button>
            <Button variant="text" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="text" onClick={() => setConfirming(true)}>
            Delete my account
          </Button>
        )}
      </div>
      {failed ? <p className="err t-meta">Could not delete account. Please try again.</p> : null}
    </section>
  );
}
