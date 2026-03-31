"use client";

import { useEffect } from "react";

export function useGameKeys(
  keymap: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const fn = keymap[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keymap, enabled]);
}
