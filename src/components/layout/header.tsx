"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl" aria-hidden>🌍</span>
          <span className="text-xl font-extrabold tracking-tight">
            Countr<span className="text-gold">ivo</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/games">Games</NavLink>
          <NavLink href="/countries">Countries</NavLink>
          <NavLink href="/categories">Rankings</NavLink>
          <Link
            href="/games/country-draft/play?mode=daily"
            className="ml-3 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors"
          >
            Daily Challenge
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-cream-muted hover:text-cream"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-surface animate-in">
          <div className="px-4 py-4 space-y-1">
            <MobileNavLink href="/games" onClick={() => setMobileOpen(false)}>
              🎮 All Games
            </MobileNavLink>
            <MobileNavLink href="/countries" onClick={() => setMobileOpen(false)}>
              🌍 Countries
            </MobileNavLink>
            <MobileNavLink href="/categories" onClick={() => setMobileOpen(false)}>
              📊 Rankings
            </MobileNavLink>
            <Link
              href="/games/country-draft/play?mode=daily"
              onClick={() => setMobileOpen(false)}
              className="block mt-3 px-4 py-3 bg-gold text-white text-center font-semibold rounded-lg"
            >
              Play Daily Challenge
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-cream-muted hover:text-cream hover:bg-surface rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-base font-medium text-cream hover:bg-surface rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
