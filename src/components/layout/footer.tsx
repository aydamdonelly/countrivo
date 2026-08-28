import Link from "next/link";
import { getAllGames } from "@/lib/data/registry";

export function Footer() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-border bg-surface-elevated rounded-t-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav aria-label="Footer navigation">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Play */}
            <div>
              <h3 className="font-bold text-sm mb-3">Play</h3>
              <div className="space-y-2 text-sm text-cream-muted">
                <Link href="/" className="block hover:text-cream transition-colors">Daily challenge</Link>
                <Link href="/games" className="block hover:text-cream transition-colors">All games</Link>
                <Link href="/games/country-draft" className="block hover:text-cream transition-colors">Country Draft</Link>
                <Link href="/games/flag-quiz" className="block hover:text-cream transition-colors">Flag Quiz</Link>
                <Link href="/games/higher-or-lower" className="block hover:text-cream transition-colors">Higher or Lower</Link>
                <Link href="/games" className="block hover:text-cream transition-colors text-gold-ink font-medium">All {getAllGames().length} games →</Link>
              </div>
            </div>

            {/* Browse */}
            <div>
              <h3 className="font-bold text-sm mb-3">Browse</h3>
              <div className="space-y-2 text-sm text-cream-muted">
                <Link href="/countries" className="block hover:text-cream transition-colors">All 243 countries</Link>
                <Link href="/categories" className="block hover:text-cream transition-colors">All rankings</Link>
                <Link href="/lists" className="block hover:text-cream transition-colors">All lists</Link>
                <Link href="/lists/most-populated-countries" className="block hover:text-cream transition-colors">Most populated</Link>
                <Link href="/lists/richest-countries" className="block hover:text-cream transition-colors">Richest (GDP/capita)</Link>
              </div>
            </div>

            {/* You */}
            <div>
              <h3 className="font-bold text-sm mb-3">You</h3>
              <div className="space-y-2 text-sm text-cream-muted">
                <Link href="/profile" className="block hover:text-cream transition-colors">Profile</Link>
                <Link href="/friends" className="block hover:text-cream transition-colors">Friends</Link>
              </div>
            </div>

            {/* Countrivo */}
            <div>
              <h3 className="font-bold text-sm mb-3">Countrivo</h3>
              <div className="space-y-2 text-sm text-cream-muted">
                <p className="text-xs">Competitive daily geography games with stats depth. {getAllGames().length} games, 243 countries.</p>
                <Link href="/privacy" className="block hover:text-cream transition-colors">Privacy</Link>
                <Link href="/terms" className="block hover:text-cream transition-colors">Terms</Link>
                <Link href="/support" className="block hover:text-cream transition-colors">Support</Link>
                <p className="text-xxs text-cream-muted mt-3">Data: World Bank, REST Countries, WHO, UNWTO</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Brand mark strip — middle-dot bracket signature */}
        <div className="mt-10 pt-6 border-t border-border text-center text-xxs font-mono text-cream-muted">
          <span className="font-extrabold not-italic text-cream tracking-tight">
            Coun<span className="text-gold mx-[1px]">·</span>trivo
          </span>
          <span className="text-gold mx-1.5">·</span>
          <span>One puzzle a day</span>
          <span className="text-gold mx-1.5">·</span>
          <span>Since 2026</span>
        </div>
      </div>
    </footer>
  );
}
