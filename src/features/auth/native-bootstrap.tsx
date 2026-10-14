"use client";

import { useEffect, useState } from "react";

/**
 * Runs the one-time native (Capacitor) initialisation. No-op on the website. Mounted
 * in the root layout. Native capabilities never restore or create an account.
 */
export function NativeBootstrap() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    // The native shell injects its bridge before the remote page loads.
    const capacitor: unknown = Reflect.get(window, "Capacitor");
    if (!capacitor || typeof capacitor !== "object" || !("isNativePlatform" in capacitor) || typeof capacitor.isNativePlatform !== "function" || !capacitor.isNativePlatform()) return;
    void import("@/lib/native/bootstrap").then(({ bootstrapNative }) => bootstrapNative(setOffline)).catch(() => {});
  }, []);
  return offline ? <p className="native-offline t-meta" role="status">You&apos;re offline. Your next move needs a connection.</p> : null;
}
