import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import { getAllCountries } from "@/lib/data/countries";
import { getAllCategories } from "@/lib/data/categories";

export default function HomePage() {
  const games = getAllGames();
  const flagship = games.find((g) => g.isFlagship)!;
  const otherGames = games.filter((g) => !g.isFlagship);
  const countries = getAllCountries();
  const categories = getAllCategories();

  return (
    <>
      {/* Hero — full width, bold */}
      <section className="relative overflow-hidden bg-surface-dark text-text-inverse">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
          <div className="text-[12rem] leading-none tracking-tighter font-black text-white/5 select-none whitespace-nowrap overflow-hidden">
            🇧🇷 🇩🇪 🇯🇵 🇳🇬 🇫🇷 🇮🇳 🇦🇺 🇰🇷 🇲🇽 🇬🇧 🇨🇦 🇮🇹 🇪🇬 🇦🇷 🇹🇭
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              How well do you
              <br />
              <span className="text-brand">know the world?</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed">
              {games.length} free geography games. Daily challenges, country stats,
              flag quizzes, and strategy puzzles. No account needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/games/country-draft/play?mode=daily"
                className="px-6 py-3.5 bg-brand text-white font-bold text-lg rounded-xl hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25"
              >
                Play Today&apos;s Challenge
              </Link>
              <Link
                href="/games"
                className="px-6 py-3.5 bg-white/10 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Browse All Games
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship game — prominent card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <Link
          href={flagship.route}
          className="game-card block bg-surface border border-border p-6 sm:p-8 lg:p-10 shadow-xl group"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="text-6xl lg:text-7xl shrink-0">{flagship.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold group-hover:text-brand transition-colors">
                  {flagship.title}
                </h2>
                <span className="px-2.5 py-1 bg-brand text-white text-xs font-bold rounded-md uppercase tracking-wide">
                  Featured
                </span>
              </div>
              <p className="text-text-secondary text-lg leading-relaxed max-w-2xl">
                {flagship.description}
              </p>
              <div className="flex items-center gap-6 mt-4 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">⏱ {flagship.estimatedTime}</span>
                <span className="flex items-center gap-1.5 capitalize">📊 {flagship.difficulty}</span>
                <span className="flex items-center gap-1.5">📅 Daily + Practice</span>
              </div>
            </div>
            <div className="hidden lg:flex items-center shrink-0">
              <span className="px-6 py-3 bg-brand/10 text-brand font-bold rounded-xl group-hover:bg-brand group-hover:text-white transition-all">
                Play Now →
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* All Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold">All Games</h2>
            <p className="text-text-muted mt-1">{games.length} geography games to test your knowledge</p>
          </div>
          <Link href="/games" className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors hidden sm:block">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {otherGames.map((game) => (
            <Link
              key={game.slug}
              href={game.route}
              className="game-card bg-surface border border-border p-5 group"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{game.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-bold group-hover:text-brand transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">
                    {game.shortDescription}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                    <span className="px-2 py-0.5 bg-surface-muted rounded-md">{game.estimatedTime}</span>
                    <span className="px-2 py-0.5 bg-surface-muted rounded-md capitalize">{game.difficulty}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO content — "What is Countrivo?" + stats + internal links */}
      <section className="bg-surface-muted border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="text-3xl font-extrabold mb-6">
                Free Geography Games Online
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Countrivo is a free collection of browser-based geography games.
                  Test your knowledge of world countries, flags, capitals, population
                  rankings, and dozens of other statistics — no downloads or accounts required.
                </p>
                <p>
                  Play our flagship <strong>Country Draft</strong> game, where you assign
                  countries to stat categories and compete against the mathematically
                  optimal solution. Or try <strong>Flag Quiz</strong>, <strong>Higher
                  or Lower</strong>, <strong>Capital Match</strong>, and {otherGames.length - 3} more games.
                </p>
                <p>
                  Every game has a daily challenge with the same puzzle for all players,
                  plus unlimited practice mode. Share your results and compete with friends.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-6 text-text-muted uppercase tracking-wide">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard value={games.length.toString()} label="Geography Games" />
                <StatCard value={countries.length.toString()} label="Countries Covered" />
                <StatCard value={categories.length.toString()} label="Stat Categories" />
                <StatCard value="Daily" label="New Challenges" />
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 text-text-muted uppercase tracking-wide">Explore</h3>
                <div className="flex flex-wrap gap-2">
                  {["Europe", "Asia", "Africa", "Americas", "Oceania"].map((c) => (
                    <Link
                      key={c}
                      href={`/countries?continent=${c}`}
                      className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium hover:border-brand/30 transition-colors"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Popular countries for internal linking / SEO */}
          <div className="mt-16 pt-12 border-t border-border">
            <h3 className="text-lg font-bold mb-6">Popular Countries</h3>
            <div className="flex flex-wrap gap-2">
              {["united-states", "germany", "japan", "brazil", "france", "india",
                "united-kingdom", "australia", "canada", "south-korea", "mexico",
                "italy", "spain", "russia", "china", "nigeria", "egypt", "turkey",
                "argentina", "thailand"].map((slug) => {
                const country = countries.find((c) => c.slug === slug);
                if (!country) return null;
                return (
                  <Link
                    key={slug}
                    href={`/countries/${slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm hover:border-brand/30 transition-colors"
                  >
                    <span>{country.flagEmoji}</span>
                    <span>{country.displayName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-4 bg-surface border border-border rounded-xl">
      <div className="text-3xl font-extrabold text-brand">{value}</div>
      <div className="text-sm text-text-muted mt-1">{label}</div>
    </div>
  );
}
