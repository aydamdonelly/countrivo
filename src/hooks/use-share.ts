"use client";
import { useState, useCallback } from "react";

export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled
    }
  }, []);

  return { share, copied };
}
