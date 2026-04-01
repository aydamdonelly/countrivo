"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StreakBadge } from "@/components/streak-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getStorageItem } from "@/lib/storage";
import { getAllGames } from "@/lib/data/games";
import { getTodayDateKey } from "@/lib/daily-seed";

const NAV_ITEMS = [
  { href: "/games", label: "Play" },
  { href: "/categories", label: "Rankings" },
  { href: "/friends", label: "Friends" },
];

function countTodayCompleted(): number {
  if (typeof window === "undefined") return 0;
  const games = getAllGames();
  const dateKey = getTodayDateKey();
  return games.filter((g) =>
    g.availableModes.includes("daily") &&
    getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false)
  ).length;
}

export function Header() {
  const pathname = usePathname();
  const { user, profile, loading, openAuthModal, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    setDailyCount(countTodayCompleted());
    setMounted(true);
  }, []);

  const initial = profile?.displayName?.[0]?.toUpperCase() ?? profile?.username?.[0]?.toUpperCase() ?? "?";
  const totalDaily = 11;

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

          {/* Daily progress pill */}
          {mounted && dailyCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-cream-muted px-2 py-1 rounded-lg bg-black/5">
              {dailyCount}/{totalDaily}
            </span>
          )}

          {!loading && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-gold text-white text-sm font-bold flex items-center justify-center hover:brightness-110 transition-all active:scale-95"
              >
                {initial}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-border py-1.5 animate-in z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-bold truncate">{profile?.displayName ?? "Player"}</p>
                    <p className="text-xs text-cream-muted truncate">@{profile?.username}</p>
                    {profile && profile.streakCurrent > 0 && (
                      <p className="text-xs text-gold font-bold mt-1">🔥 {profile.streakCurrent}-day streak</p>
                    )}
                  </div>
                  <Link
                    href="/games/country-draft/play?mode=daily"
                    className="block px-3 py-2 text-sm hover:bg-black/3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Daily challenge
                  </Link>
                  <Link
                    href="/games"
                    className="block px-3 py-2 text-sm hover:bg-black/3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    All games
                  </Link>
                  <Link
                    href="/friends"
                    className="block px-3 py-2 text-sm hover:bg-black/3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Friends
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-cream-muted hover:bg-black/3 hover:text-cream transition-colors border-t border-border mt-1 pt-2"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <>
              <button
                onClick={() => openAuthModal()}
                className="text-xs sm:text-sm font-medium text-cream-muted hover:text-cream transition-colors"
              >
                Sign in
              </button>
              <Link
                href="/games/country-draft/play?mode=daily"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gold text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-[0.97]"
              >
                <span className="sm:hidden">Daily</span>
                <span className="hidden sm:inline">Daily challenge</span>
              </Link>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black/5 animate-pulse" />
          )}
        </div>
      </nav>
    </header>
  );
}
