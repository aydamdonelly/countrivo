"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconTrophy, IconUsers, IconUser } from "@/components/icons";

const TABS = [
  { href: "/", label: "Play", Icon: IconHome, match: (p: string) => p === "/" || p.startsWith("/games") },
  { href: "/categories", label: "Ranks", Icon: IconTrophy, match: (p: string) => p.startsWith("/categories") || p.startsWith("/lists") },
  { href: "/friends", label: "Friends", Icon: IconUsers, match: (p: string) => p.startsWith("/friends") },
  { href: "/profile", label: "You", Icon: IconUser, match: (p: string) => p.startsWith("/profile") },
] as const;

/**
 * Phone-only bottom tab bar. Hidden during active gameplay and auth flows so it
 * never covers game controls. The active tab reads through weight and colour,
 * nothing bolted on.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.endsWith("/play") || pathname.startsWith("/auth")) return null;

  return (
    <>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] sm:hidden" />
      <nav
        aria-label="Primary"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-surface/92 backdrop-blur-md safe-bottom border-t border-border"
      >
        <ul className="flex items-stretch justify-around px-2">
          {TABS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 h-16 text-[11px] transition-colors active:scale-95 ${active ? "text-cream font-semibold" : "text-cream-dim font-medium"}`}
                >
                  <Icon width={24} height={24} strokeWidth={active ? 2 : 1.5} aria-hidden />
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
