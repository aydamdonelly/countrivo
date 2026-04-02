"use client";

import { useEffect, useRef } from "react";

export function useGameKeys(
  keymap: Record<string, () => void>,
  enabled = true
) {
  const keymapRef = useRef(keymap);
  keymapRef.current = keymap;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const fn = keymapRef.current[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
