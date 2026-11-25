"use client";

import Link, { useLinkStatus } from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import "./navigation-link.css";

interface NavigationLinkProps extends ComponentProps<typeof Link> {
  pendingLabel?: ReactNode;
  documentPending?: boolean;
}

/** Show a click's progress while Next keeps the current page usable. */
export function NavigationLink({ children, pendingLabel = "Opening…", documentPending, className, ...props }: NavigationLinkProps) {
  const [intentHref, setIntentHref] = useState<string | null>(null);
  const disabled = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const warm = () => {
    if (disabled || typeof props.href !== "string" || intentHref === props.href) return;
    const target = new URL(props.href, window.location.href);
    if (target.origin !== window.location.origin || target.pathname + target.search === window.location.pathname + window.location.search) return;
    setIntentHref(props.href);
    const game = target.pathname.match(/^\/games\/([^/]+)\/play$/)?.[1];
    if (game) void import("@/features/play/preload-game-host").then(module => module.preloadGameHost(game)).catch(() => undefined);
  };
  const onNavigate: ComponentProps<typeof Link>["onNavigate"] = event => {
    if (disabled) event.preventDefault();
    else props.onNavigate?.(event);
  };
  return <Link {...props} prefetch={intentHref === props.href ? true : props.prefetch} className={[className, "navigation-link"].filter(Boolean).join(" ")} onNavigate={onNavigate}
    onMouseEnter={event => { props.onMouseEnter?.(event); warm(); }}
    onFocus={event => { props.onFocus?.(event); warm(); }}
    onPointerDown={event => { props.onPointerDown?.(event); if (event.isPrimary && event.button === 0) warm(); }}>
    {children}<NavigationStatus pendingLabel={pendingLabel} documentPending={documentPending} />
  </Link>;
}

function NavigationStatus({ pendingLabel, documentPending }: { pendingLabel: ReactNode; documentPending?: boolean }) {
  const { pending: linkPending } = useLinkStatus();
  const pending = documentPending || linkPending;
  return <span className="navigation-status" data-pending={pending || undefined} aria-busy={pending || undefined} role="status" aria-atomic="true">
    <span className="navigation-status-label">{pending ? pendingLabel : null}</span>
    <svg className="navigation-status-mark" viewBox="0 0 32 16" width="32" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 3 5 5-5 5m10-10 5 5-5 5m10-10 5 5-5 5" /></svg>
  </span>;
}
