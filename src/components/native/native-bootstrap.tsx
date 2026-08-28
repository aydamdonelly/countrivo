"use client";

import { useEffect } from "react";
import { bootstrapNative } from "@/lib/native/bootstrap";

/**
 * Runs the one-time native (Capacitor) initialization. No-op on the website.
 * Mounted inside <AuthProvider> in the root layout.
 */
export function NativeBootstrap() {
  useEffect(() => {
    void bootstrapNative();
  }, []);
  return null;
}
