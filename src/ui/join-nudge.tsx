"use client";

import { ArrowDownIcon } from "@/ui/icons/arrow-down";
import { UserIcon } from "@/ui/icons/user";

/**
 * The invitation to join today's leaderboard, inside the result card right under your place
 * (26 November 2026). The card fills a phone screen, so the name field below it is easy to miss:
 * one tap here brings the field into view and opens the keyboard.
 */
export function JoinNudge() {
  function go() {
    const input = document.querySelector<HTMLInputElement>(".leaderboard-entry .join-name");
    if (!input) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    input.closest(".join-panel")?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    input.focus({ preventScroll: true });
  }
  return <button type="button" className="rc-join" onClick={go}>
    <span className="rc-join-icon" aria-hidden="true"><UserIcon size={20} /></span>
    <span className="rc-join-copy"><b>Put your name on the board</b><small>No account needed. Takes a name and a flag.</small></span>
    <ArrowDownIcon size={18} className="rc-join-arrow" />
  </button>;
}
