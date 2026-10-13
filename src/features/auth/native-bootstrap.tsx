"use client";

import { useEffect, useState } from "react";
import { bootstrapNative } from "@/lib/native/bootstrap";

/**
 * Runs the one-time native (Capacitor) initialisation. No-op on the website. Mounted
 * in the root layout. Native capabilities never restore or create an account.
 */
export function NativeBootstrap() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    void bootstrapNative(setOffline).catch(() => {});
  }, []);
  return offline ? <p className="native-offline t-meta" role="status">You&apos;re offline. Your next move needs a connection.</p> : null;
}
