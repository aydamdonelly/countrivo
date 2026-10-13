"use client";

import { QuickRemoteHost } from "@/features/play/quick-remote-host";
import type { HostProps } from "@/games/types";

export function HigherOrLowerHost(p: HostProps) {
  return <QuickRemoteHost {...p} />;
}
