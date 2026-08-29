"use client";

import { Button } from "@/ui/button";
import { SectionHead } from "@/ui/section-head";
import { useToast } from "@/ui/toast";

const SITE = "https://countrivo.com";

/**
 * The invite link (blueprint 7.14): the public URL as one mute line and a Copy that toasts.
 * The URL is the live site, not `window.location.origin`, so the same string is server
 * rendered and copied, and an invite sent from the app still opens on the web.
 */
export function InviteRow({ username }: { username: string }) {
  const toast = useToast();
  const url = `${SITE}/friends/add/${username}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Copied");
    } catch {
      /* a browser without clipboard access: the URL is on screen to copy by hand */
    }
  }

  return (
    <section className="sec">
      <SectionHead title="Your invite link" />
      <div className="invite">
        <span className="url t-meta">countrivo.com/friends/add/{username}</span>
        <Button variant="text" onClick={() => void copy()}>
          Copy
        </Button>
      </div>
    </section>
  );
}
