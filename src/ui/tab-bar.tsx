"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/ui/icons";
import { Crest } from "@/ui/crest";
import { NAV_ITEMS } from "@/ui/nav";
import type { Viewer } from "@/ui/types";

export interface TabBarProps {
  viewer?: Viewer | null;
  /** Pending friend requests (signed-in viewers only): `Friends 2` in ember, never a pill. */
  pendingRequests?: number;
  /** Overrides usePathname (the kit page uses it). */
  pathname?: string;
  /** In-flow instead of fixed (the kit page). */
  inline?: boolean;
  className?: string;
}

/** Hidden on play and auth routes (blueprint 3.27). */
export function hidesTabBar(pathname: string): boolean {
  return /^\/games\/[^/]+\/play(\/|$)/.test(pathname) || pathname.startsWith("/auth");
}

/**
 * The K3 tab bar: fixed bottom, 80 px plus the safe area, bar fill, no border, no blur.
 * Four columns with 11 px labels; the active item is ink with the seed dot in ember,
 * inactive faint. Signed in, the You icon is the viewer's crest.
 */
export function TabBar({ viewer, pendingRequests = 0, pathname: override, inline, className }: TabBarProps) {
  const current = usePathname();
  const pathname = override ?? current ?? "/";
  if (!inline && hidesTabBar(pathname)) return null;
  return (
    <nav className={cn("tabbar", inline && "tabbar-inline", className)} aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const you = item.label === "You" && viewer?.signedIn;
        const count = item.label === "Friends" && viewer?.signedIn && pendingRequests > 0 ? pendingRequests : 0;
        return (
          <Link key={item.href} href={item.href} prefetch aria-current={active ? "page" : undefined} className="t-kicker">
            {you ? (
              <span className="you">
                <Crest path={viewer?.crest ?? null} size={22} />
              </span>
            ) : (
              <Icon name={item.icon} size={24} seed={active ? "ember" : undefined} />
            )}
            <span>
              {item.label}
              {count > 0 ? <i className="cnt">{count}</i> : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
