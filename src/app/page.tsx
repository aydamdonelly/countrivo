import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import { getAllCountries } from "@/lib/data/countries";
import { getAllCategories } from "@/lib/data/categories";
import { HeroGlobe } from "@/components/layout/hero-globe";

export default function HomePage() {
  const games = getAllGames();
  const flagship = games.find((g) => g.isFlagship)!;
  const otherGames = games.filter((g) => !g.isFlagship);
  const countries = getAllCountries();
  const categories = getAllCategories();

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-surface-dark text-text-inverse min-h-130 sm:min-h-140 lg:min-h-150 flex items-center">
        {/* Globe illustration on the right */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 hidden md:block pointer-events-none" aria-hidden>
          <HeroGlobe />
        </div>

        {/* Floating flag particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <span className="absolute text-5xl opacity-15 top-[10%] left-[5%] animate-float-slow">🇧🇷</span>
          <span className="absolute text-4xl opacity-10 top-[20%] right-[15%] animate-float-medium">🇯🇵</span>
          <span className="absolute text-6xl opacity-10 bottom-[15%] left-[60%] animate-float-slow">🇩🇪</span>
          <span className="absolute text-4xl opacity-15 bottom-[25%] left-[15%] animate-float-medium">🇫🇷</span>
          <span className="absolute text-5xl opacity-10 top-[60%] right-[8%] animate-float-slow">🇮🇳</span>
          <span className="absolute text-3xl opacity-15 top-[5%] left-[45%] animate-float-medium">🇦🇺</span>
          <span className="absolute text-4xl opacity-10 bottom-[5%] right-[35%] animate-float-slow">🇲🇽</span>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white/80 mb-6">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              New daily challenge available
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              How well do you
              <br />
              <span className="text-brand">know the world?</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed">
              {games.length} free geography games. Daily challenges, country stats,
              flag quizzes, and strategy puzzles. No account needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/games/country-draft/play?mode=daily"
                className="px-7 py-4 bg-brand text-white font-bold text-lg rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
              >
                Play Today&apos;s Challenge
              </Link>
              <Link
                href="/games"
                className="px-7 py-4 bg-white/10 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Browse All Games
              </Link>
            </div>
            {/* Quick stats inline */}
            <div className="mt-10 flex items-center gap-6 text-sm text-white/40">
              <span><strong className="text-white/70">{games.length}</strong> games</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span><strong className="text-white/70">{countries.length}</strong> countries</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span><strong className="text-white/70">{categories.length}</strong> stats</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FLAGSHIP GAME ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
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
                <span>⏱ {flagship.estimatedTime}</span>
                <span className="capitalize">📊 {flagship.difficulty}</span>
                <span>📅 Daily + Practice</span>
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

      {/* ═══ ALL GAMES ═══ */}
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
              <span className="text-4xl block mb-3">{game.emoji}</span>
              <h3 className="text-lg font-bold group-hover:text-brand transition-colors">
                {game.title}
              </h3>
              <p className="text-sm text-text-muted mt-1 line-clamp-2">
                {game.shortDescription}
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-text-muted">
                <span className="px-2 py-0.5 bg-surface-muted rounded-md">{game.estimatedTime}</span>
                <span className="px-2 py-0.5 bg-surface-muted rounded-md capitalize">{game.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ SEO CONTENT + STATS ═══ */}
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

          {/* Popular countries */}
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
    <div className="p-5 bg-surface border border-border rounded-xl">
      <div className="text-3xl font-extrabold text-brand">{value}</div>
      <div className="text-sm text-text-muted mt-1">{label}</div>
    </div>
  );
}
