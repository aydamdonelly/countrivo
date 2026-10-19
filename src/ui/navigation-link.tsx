"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";

interface NavigationLinkProps extends ComponentProps<typeof Link> {
  pendingLabel?: ReactNode;
}

/** Show a click's progress while Next keeps the current page usable. */
export function NavigationLink({ children, pendingLabel = "Opening…", ...props }: NavigationLinkProps) {
  const onNavigate: ComponentProps<typeof Link>["onNavigate"] = event => {
    if (props["aria-disabled"] === true || props["aria-disabled"] === "true") event.preventDefault();
    else props.onNavigate?.(event);
  };
  return <Link {...props} onNavigate={onNavigate}><NavigationLabel pendingLabel={pendingLabel}>{children}</NavigationLabel></Link>;
}

function NavigationLabel({ children, pendingLabel }: { children: ReactNode; pendingLabel: ReactNode }) {
  const { pending } = useLinkStatus();
  return <span style={{ display: "contents" }} aria-live="polite" aria-busy={pending || undefined}>{pending ? pendingLabel : children}</span>;
}
