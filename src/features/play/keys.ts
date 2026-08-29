"use client";

import { useEffect, useRef } from "react";

/**
 * Binds a key map while the board is live and not busy (blueprint 8.5). Keys typed into an
 * editable element are never intercepted (the typed games handle Enter in their field), and
 * modified or repeated keys pass through. The map is read from a ref, so rebinding on every
 * state change costs nothing.
 */
export function usePlayKeys(keymap: Record<string, () => void>, enabled: boolean): void {
  const ref = useRef(keymap);
  useEffect(() => {
    ref.current = keymap;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const fn = ref.current[e.key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
