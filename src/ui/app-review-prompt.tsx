"use client";

import { useEffect } from "react";

const STORAGE_KEY = "cv_review_v1";
const MIN_DAYS_BETWEEN_ASKS = 120;

interface ReviewState {
  /** `${dateKey}#${done}` for every finished daily seen, so a reload never counts twice. */
  finished: string[];
  askedAt: number;
}

/**
 * Inside the iOS app only: Apple's own rating sheet after an engaged session. Needs three
 * finished dailies on two different days, at least two finished today, and 120 days since
 * the last ask (Apple also caps it at three times a year). Never a custom prompt or button.
 */
export function AppReviewPrompt({ dateKey, done }: { dateKey: string; done: number }) {
  useEffect(() => {
    let timer: number | undefined;
    let active = true;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios" || !Capacitor.isPluginAvailable("InAppReview")) return;
      let state: ReviewState = { finished: [], askedAt: 0 };
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (stored && typeof stored === "object" && "finished" in stored && Array.isArray(stored.finished) && "askedAt" in stored && typeof stored.askedAt === "number") {
          state = { finished: stored.finished.filter((entry): entry is string => typeof entry === "string"), askedAt: stored.askedAt };
        }
      } catch { /* storage unavailable: treat as a first visit */ }
      const entry = `${dateKey}#${done}`;
      if (!state.finished.includes(entry)) state.finished = [...state.finished, entry].slice(-60);
      const days = new Set(state.finished.map((item) => item.split("#")[0]));
      const eligible = state.finished.length >= 3 && days.size >= 2 && done >= 2 && Date.now() - state.askedAt > MIN_DAYS_BETWEEN_ASKS * 86_400_000;
      if (eligible) state.askedAt = Date.now();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* best effort */ }
      if (!eligible || !active) return;
      const { InAppReview } = await import("@capacitor-community/in-app-review");
      timer = window.setTimeout(() => { void InAppReview.requestReview().catch(() => undefined); }, 2500);
    })().catch(() => undefined);
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [dateKey, done]);
  return null;
}
