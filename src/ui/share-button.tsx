"use client";

import { Button } from "@/ui/button";
import { useToast } from "@/ui/toast";

export interface ShareButtonProps {
  /** The clipboard text from src/lib/share; never rendered on screen. */
  text: string;
  label?: string;
  className?: string;
}

/**
 * Share (blueprint 3.29): a text button with the up-right arrow. Native share when the
 * browser has it (silent on abort), else clipboard plus the "Copied" toast. No sheet,
 * no preview, no mono.
 */
export function ShareButton({ text, label = "Share", className }: ShareButtonProps) {
  const toast = useToast();
  async function share() {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
      } catch {
        // The user closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      // Clipboard unavailable (insecure context); nothing to show.
    }
  }
  return (
    <Button variant="text" icon="arrow-up-right" onClick={share} className={className}>
      {label}
    </Button>
  );
}
