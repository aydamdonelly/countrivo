"use client";

import { useEffect } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";

// One-time global reset of a single day's daily challenges. On first load after
// deploy, every client wipes that date's lockout / completed / result / progress
// keys so already-played users get a clean slate, matching the server-side run
// deletion. Personal-best and streak history (other dates) are left untouched.
//
// To reset another day later, bump RESET_DATE to that date's key.
const RESET_DATE = "2026-05-29"; // date substring matched in localStorage keys
const RESET_TAG = "2026-05-29#2"; // marker value — bump to re-trigger the wipe
const FAMILIES = ["countrivo_lockout_", "countrivo_daily_", "countrivo_progress_"];

export function DailyResetOnce() {
  useEffect(() => {
    try {
      if (getStorageItem<string>("reset_done", "") === RESET_TAG) return;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes(RESET_DATE) && FAMILIES.some((p) => key.startsWith(p))) {
          localStorage.removeItem(key);
        }
      }
      setStorageItem("reset_done", RESET_TAG);
    } catch {
      // localStorage may be unavailable (private mode) — nothing to reset.
    }
  }, []);

  return null;
}
