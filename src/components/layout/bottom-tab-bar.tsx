"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBolt,
  IconScale,
  IconUsers,
  IconUser,
} from "@/components/icons";

const TABS = [
  { href: "/games", label: "Play", Icon: IconBolt },
  { href: "/categories", label: "Rankings", Icon: IconScale },
  { href: "/friends", label: "Friends", Icon: IconUsers },
  { href: "/profile", label: "Profile", Icon: IconUser },
] as const;

/**
 * Phone-only bottom tab bar (the header nav is hidden < sm; desktop keeps it).
 * Hidden during active gameplay and auth flows so it never covers game
 * controls. Renders an in-flow spacer of equal height so the fixed bar can't
 * overlap the footer / last content.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  // Match the /play segment exactly (not a substring) so a future /replay or
  // /display route doesn't accidentally hide the bar.
  if (pathname.endsWith("/play") || pathname.startsWith("/auth")) return null;

  return (
    <>
      <div
        aria-hidden
        className="h-[calc(3.75rem+env(safe-area-inset-bottom))] sm:hidden"
      />
      <nav
        aria-label="Primary"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-border bg-surface/90 backdrop-blur-md safe-bottom"
      >
        <ul className="flex items-stretch justify-around">
          {TABS.map(({ href, label, Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-0.5 h-[3.75rem] text-xxs font-semibold tracking-tight transition-colors active:scale-95 ${
                    active ? "text-gold-ink" : "text-cream-muted"
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gold" />
                  )}
                  <Icon width={22} height={22} aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
