"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/ui/icons";
import { Crest } from "@/ui/crest";
import type { Viewer } from "@/ui/types";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** The active rule (blueprint 3.27). */
  match: (pathname: string) => boolean;
}

/** Play, Ranks, Friends, You: the four targets of the tab bar and the desktop nav. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Play", icon: "home", match: (p) => p === "/" || p.startsWith("/games") },
  { href: "/categories", label: "Ranks", icon: "trophy", match: (p) => /^\/(categories|lists|countries)(\/|$)/.test(p) },
  { href: "/friends", label: "Friends", icon: "users", match: (p) => p.startsWith("/friends") },
  { href: "/profile", label: "You", icon: "user", match: (p) => p.startsWith("/profile") },
];

export interface NavProps {
  viewer?: Viewer | null;
  /** Overrides usePathname (the kit page uses it to show the active state). */
  pathname?: string;
  className?: string;
}

/**
 * Desktop nav (blueprint 3.28), inline in the header at >= 1024: Icon 20 + label, active
 * ink 600 with the seed in ember, inactive mute. Signed in, the You item shows the crest.
 * No dot, no underline, no bar. Client only for the active state.
 */
export function Nav({ viewer, pathname: override, className }: NavProps) {
  const current = usePathname();
  const pathname = override ?? current ?? "/";
  return (
    <nav className={className ? `nav ${className}` : "nav"} aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const you = item.label === "You" && viewer?.signedIn;
        return (
          <Link key={item.href} href={item.href} prefetch aria-current={active ? "page" : undefined}>
            {you ? <Crest path={viewer?.crest ?? null} size={20} /> : <Icon name={item.icon} size={20} seed={active ? "ember" : undefined} />}
            <span className="t-body">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
