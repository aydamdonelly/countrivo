"use client";

import { Button } from "@/ui/button";
import { useToast } from "@/ui/toast";
import { useId, useState } from "react";
import { Sheet } from "@/ui/sheet";

export interface ShareButtonProps {
  /** The clipboard text from src/lib/share; never rendered on screen. */
  text: string;
  label?: string;
  /** Called on every press, before the share sheet or the clipboard. */
  onShare?: () => void;
  className?: string;
}

/**
 * Share (blueprint 3.29): a text button with the up-right arrow. Native share when the
 * browser has it (silent on abort), else clipboard plus the "Copied" toast.
 * A selectable text sheet remains available when both APIs are unavailable.
 */
export function ShareButton({ text, label = "Share", onShare, className }: ShareButtonProps) {
  const toast = useToast();
  const [fallback, setFallback] = useState(false);
  const title = useId();
  async function share() {
    if (typeof navigator === "undefined") return;
    onShare?.();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      setFallback(true);
    }
  }
  return (
    <><Button variant="text" icon="arrow-up-right" onClick={share} className={className}>
      {label}
    </Button><Sheet open={fallback} onClose={() => setFallback(false)} labelledBy={title}>
      <h2 id={title} className="t-h3">Share your result</h2>
      <p className="t-body text-mute">Select the text and copy it into a message.</p>
      <textarea className="share-fallback" aria-label="Result to share" value={text} readOnly rows={7} onFocus={(event) => event.target.select()} />
      <Button variant="ink" onClick={() => setFallback(false)}>Done</Button>
    </Sheet></>
  );
}
