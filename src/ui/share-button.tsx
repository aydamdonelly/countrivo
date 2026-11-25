"use client";

import { Button, type ButtonVariant } from "@/ui/button";
import { useToast } from "@/ui/toast";
import { useId, useState } from "react";
import { Sheet } from "@/ui/sheet";
import { trackShareResult } from '@/lib/play-events';
import { challengeShareText } from '@/lib/challenges';
import { trackUsage } from '@/lib/usage-events';

export interface ShareButtonProps {
  /** The clipboard text from src/lib/share; never rendered on screen. */
  text: string;
  challengeUrl?: string;
  label?: string;
  /** Called on every press, before the share sheet or the clipboard. */
  onShare?: () => void;
  className?: string;
  /** Secondary by default; primary only where sharing is the screen's main action (the day). */
  variant?: ButtonVariant;
  block?: boolean;
  /** Where the press happened, for usage events. Defaults to home for the day share. */
  source?: "home" | "result";
}

/**
 * Share (blueprint 3.29, 25 November 2026): a button led by the share glyph. Native share when the
 * browser has it (silent on abort), else clipboard plus the "Copied" toast.
 * A selectable text sheet remains available when both APIs are unavailable.
 */
export function ShareButton({ text, challengeUrl, label = "Share result", onShare, className, variant = "secondary", block, source }: ShareButtonProps) {
  const toast = useToast();
  const [fallback, setFallback] = useState(false);
  const [sharing, setSharing] = useState(false);
  const title = useId();
  const shareText = challengeShareText(text, challengeUrl);
  const shareKind = challengeUrl ? 'challenge' : label === 'Share your day' || label === 'Share my day' || label === 'Share so far' ? 'day' : 'result';
  const recordResult = (outcome: 'native' | 'clipboard' | 'cancelled' | 'manual') => {
    trackShareResult(outcome);
    trackUsage('share_result', { action: shareKind, outcome, source: source ?? (shareKind === 'day' ? 'home' : 'result') });
  };
  async function share() {
    if (typeof navigator === "undefined") return;
    if (sharing) return;
    setSharing(true);
    trackUsage('share_intent', { action: shareKind, source: source ?? (shareKind === 'day' ? 'home' : 'result') });
    onShare?.();
    try {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText });
        recordResult('native');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") { recordResult('cancelled'); return; }
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      recordResult('clipboard');
      toast("Copied");
    } catch {
      setFallback(true);
      recordResult('manual');
    }
    } finally { setSharing(false); }
  }
  return (
    <><Button variant={variant} icon="share" block={block} onClick={share} className={className} disabled={sharing} aria-busy={sharing || undefined}>
      {sharing ? 'Sharing' : label}
    </Button><Sheet open={fallback} onClose={() => setFallback(false)} labelledBy={title}>
      <h2 id={title} className="t-h3">Share your result</h2>
      <p className="t-body text-mute">Select the text and copy it into a message.</p>
      <textarea className="share-fallback" aria-label="Result to share" value={shareText} readOnly rows={7} onFocus={(event) => event.target.select()} />
      <Button variant="primary" onClick={() => setFallback(false)}>Done</Button>
    </Sheet></>
  );
}
