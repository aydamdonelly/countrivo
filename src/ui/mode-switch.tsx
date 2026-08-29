"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Mode } from "@/ui/types";

export const MODE_HELP: Record<Mode, string> = {
  daily: "One shot per game, same board for everyone, 24 h.",
  practice: "Random boards, unlimited, nothing counts.",
};

export const MODE_COOKIE = "cv_mode";

/** Writes the mode cookie the home reads on the server (blueprint 3.5). */
export function writeModeCookie(mode: Mode): void {
  document.cookie = `${MODE_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Client enhancement of the switch: toggles `data-mode` on <main> and shows the pane
 * whose `data-pane` matches, hiding the other with `hidden` and `inert`. No refresh,
 * no reload, no localStorage; both panes stay in the DOM.
 */
export function applyMode(mode: Mode): void {
  const main = document.querySelector("main");
  if (main) main.dataset.mode = mode;
  document.querySelectorAll<HTMLElement>("[data-pane]").forEach((el) => {
    const on = el.dataset.pane === mode;
    el.hidden = !on;
    el.inert = !on;
  });
}

export interface ModeSwitchProps {
  /** The mode from the cv_mode cookie, resolved on the server. */
  mode: Mode;
  /** The no-JS form target; the proxy answers `GET /?mode=` with a 303 and the cookie. */
  action?: string;
  onChange?: (mode: Mode) => void;
  className?: string;
}

/**
 * K3 `switchK` exactly (blueprint 3.5): track 44 tall, radius 12, card fill, padding 4;
 * knob 36 tall, half width, radius 9, ink, translateX 300 ms; labels 14 px mute 500,
 * active paper 600. A GET form with two submit buttons so it works without JS.
 */
export function ModeSwitch({ mode: initial, action = "/", onChange, className }: ModeSwitchProps) {
  const [mode, setMode] = useState<Mode>(initial);

  function pick(next: Mode) {
    if (next === mode) return;
    setMode(next);
    writeModeCookie(next);
    applyMode(next);
    onChange?.(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const next: Mode = e.key === "ArrowLeft" || e.key === "Home" ? "daily" : "practice";
      pick(next);
      const btn = e.currentTarget.querySelector<HTMLButtonElement>(`button[value="${next}"]`);
      btn?.focus();
    }
  }

  return (
    <form method="get" action={action} className={className ? `sw ${className}` : "sw"} data-mode={mode}>
      <div className="sw-track" role="tablist" aria-label="Mode" onKeyDown={onKeyDown}>
        <span className="sw-knob" aria-hidden="true" />
        {(["daily", "practice"] as const).map((m) => (
          <button
            key={m}
            type="submit"
            name="mode"
            value={m}
            role="tab"
            id={`mode-tab-${m}`}
            aria-selected={mode === m}
            aria-controls={`pane-${m}`}
            tabIndex={mode === m ? 0 : -1}
            className="sw-tab t-row"
            onClick={(e) => {
              e.preventDefault();
              pick(m);
            }}
          >
            {m === "daily" ? "Daily" : "Practice"}
          </button>
        ))}
      </div>
      <small className="sw-help t-meta">{MODE_HELP[mode]}</small>
    </form>
  );
}

export interface ModePaneProps {
  mode: Mode;
  /** The mode currently shown. */
  active: Mode;
  children: ReactNode;
  className?: string;
}

/** A pane the switch shows or hides. Both panes are always in the HTML; the inactive one is hidden and inert. */
export function ModePane({ mode, active, children, className }: ModePaneProps) {
  const on = mode === active;
  return (
    <div id={`pane-${mode}`} role="tabpanel" aria-labelledby={`mode-tab-${mode}`} data-pane={mode} hidden={!on} inert={!on} className={className}>
      {children}
    </div>
  );
}
