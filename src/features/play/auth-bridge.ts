"use client";

import { requestAuth } from "@/ui/types";

/**
 * How the play frame reaches the auth provider without importing it (the provider is P1's
 * client component; the host is generic). The provider registers its two functions once on
 * mount (`registerPlayAuth`, and null on unmount); the host reads them at call time.
 *
 * Contract (understand.json native.auth): `openAuthModal(onSuccess)` runs `onSuccess` at
 * once when a session exists (a guest session included) and otherwise opens the sheet and
 * runs it after the auth event; `joinAsGuest(name)` signs in anonymously, renames the
 * profile and sets the provider's user ref synchronously, so the host's very next
 * `openAuthModal(submit)` short-circuits.
 */
export interface PlayAuth {
  openAuthModal(onSuccess?: () => void | Promise<void>): void;
  joinAsGuest(name: string): Promise<{ ok: boolean; error?: string }>;
}

let bridge: PlayAuth | null = null;

/** Called by the auth provider: `registerPlayAuth({ openAuthModal, joinAsGuest })` in an effect, `registerPlayAuth(null)` on cleanup. */
export function registerPlayAuth(next: PlayAuth | null): void {
  bridge = next;
}

/** True once the provider registered itself. */
export function hasPlayAuth(): boolean {
  return bridge !== null;
}

const FALLBACK: PlayAuth = {
  openAuthModal(onSuccess) {
    // Without a registered provider only the sheet can be asked for (F0's cv:auth event);
    // the callback cannot run, so the join row keeps its pending state.
    void onSuccess;
    requestAuth("play");
  },
  async joinAsGuest() {
    return { ok: false, error: "Could not join. Try again." };
  },
};

/** The registered bridge, or the fallback that only opens the sheet. */
export function playAuth(): PlayAuth {
  return bridge ?? FALLBACK;
}
