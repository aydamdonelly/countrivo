"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** The id of the headline inside. */
  labelledBy?: string;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A bottom sheet on phones, a centred 440 px panel at >= 768 (blueprint 3.30). Bar fill,
 * top radius 12, no grabber, scrim without blur. The content is in the DOM at full
 * opacity from the first frame; the panel slides up, the scrim colour fades. Escape and
 * a scrim click close; focus is trapped and restored.
 */
export function Sheet({ open, onClose, labelledBy, children, className }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const raf = requestAnimationFrame(() => {
      const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function onScrim(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="sheet-scrim" role="presentation" onMouseDown={onScrim}>
      <div ref={panel} className={cn("sheet", className)} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
