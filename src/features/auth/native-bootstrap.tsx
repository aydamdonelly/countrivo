"use client";

import { useEffect } from "react";
import { bootstrapNative } from "@/lib/native/bootstrap";

/**
 * Runs the one-time native (Capacitor) initialisation. No-op on the website. Mounted
 * inside <AuthProvider> in the root layout (the bootstrap rehydrates the Supabase session
 * the provider then observes).
 */
export function NativeBootstrap() {
  useEffect(() => {
    void bootstrapNative();
  }, []);
  return null;
}
