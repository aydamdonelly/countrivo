"use client";

/** Unsupported selectors throw in older iOS WebViews. */
export function isGameHelpOpen(): boolean {
  return !!document.querySelector('[data-game-help-open="true"]') ||
    typeof HTMLElement.prototype.showPopover === 'function' && !!document.querySelector(':popover-open');
}
