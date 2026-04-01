"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="font-serif text-xl text-cream tracking-tight">
          Coun<em className="text-gold not-italic">trivo</em>
        </Link>
        <div className="flex gap-5 sm:gap-7">
          <Link href="/games" className="text-sm font-medium text-cream-muted hover:text-cream transition-colors">
            Games
          </Link>
          <Link href="/categories" className="text-sm font-medium text-cream-muted hover:text-cream transition-colors">
            Rankings
          </Link>
          <Link href="/countries" className="text-sm font-medium text-cream-muted hover:text-cream transition-colors">
            Countries
          </Link>
        </div>
      </nav>
    </header>
  );
}
