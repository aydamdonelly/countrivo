"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StreakBadge } from "@/components/streak-badge";

const NAV_ITEMS = [
  { href: "/games", label: "Play" },
  { href: "/categories", label: "Rankings" },
  { href: "/countries", label: "Countries" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/5">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
        <Link href="/" className="text-xl font-bold tracking-tight shrink-0">
          Coun<span className="text-gold">trivo</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2.5 sm:py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "text-cream bg-black/5"
                    : "text-cream-muted hover:text-cream hover:bg-black/3"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <StreakBadge />
          <Link
            href="/games/country-draft/play?mode=daily"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gold text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-[0.97]"
          >
            <span className="sm:hidden">Daily</span>
            <span className="hidden sm:inline">Daily challenge</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
