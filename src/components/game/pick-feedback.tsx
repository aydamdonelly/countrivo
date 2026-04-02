"use client";

import { useEffect, useState } from "react";

interface PickFeedbackProps {
  type: "good" | "neutral" | "bad";
  message: string;
  delta?: string;
  /** Increment this to trigger a new feedback animation */
  triggerKey: number;
}

const TYPE_STYLES = {
  good: "border-correct/40 bg-correct/8 text-correct",
  neutral: "border-border bg-surface-elevated text-cream",
  bad: "border-incorrect/40 bg-incorrect/8 text-incorrect",
};

const TYPE_ICONS = {
  good: "✓",
  neutral: "→",
  bad: "✗",
};

export function PickFeedback({ type, message, delta, triggerKey }: PickFeedbackProps) {
  const [visible, setVisible] = useState(false);
  const [currentKey, setCurrentKey] = useState(-1);

  useEffect(() => {
    if (triggerKey === currentKey || triggerKey <= 0) return;
    setCurrentKey(triggerKey);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [triggerKey, currentKey]);

  if (!visible) return null;

  return (
    <div
      key={triggerKey}
      role="status"
      aria-live="polite"
      className={`pick-feedback-enter flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium ${TYPE_STYLES[type]}`}
    >
      <span className="text-base font-bold">{TYPE_ICONS[type]}</span>
      <span className="flex-1">{message}</span>
      {delta && (
        <span className="text-xs font-mono opacity-75">{delta}</span>
      )}
    </div>
  );
}
