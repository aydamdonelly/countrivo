import type { Metadata } from "next";
import Link from "next/link";
import { getFlagshipGame, getAllGames, getMainGames, getDrillGames } from "@/lib/data/games";
import { IconArrowRight } from "@/components/icons";
import { GAME_COLORS } from "@/lib/game-colors";
import { DailyHero } from "@/components/daily-hero";
import { Pill } from "@/components/ui/pill";
import { getDailySummary, checkDailyStatus } from "@/app/actions/game-runs";
import { getPendingChallenges } from "@/app/actions/challenges";
import { getTodayDateKey } from "@/lib/daily-seed";
import { createClient } from "@/lib/supabase/server";

async function getServerProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("streak_current")
      .eq("id", user.id)
      .single();
    return data ? { streakCurrent: data.streak_current ?? 0 } : null;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Countrivo | Free Geography Games & Daily Challenges",
  description:
    "Daily geography puzzles plus a deep library of practice drills. 243 countries. No signup needed.",
};

export default async function HomePage() {
  const flagship = getFlagshipGame();
  const allGames = getAllGames();
  const mainGames = getMainGames();
  const drillGames = getDrillGames();
  const mainNonFlagship = mainGames.filter((g) => !g.isFlagship);

  const todayKey = getTodayDateKey();
  const [summary, dailyStatus, profile, pendingChallenges] = await Promise.all([
    getDailySummary(flagship.slug, todayKey),
    checkDailyStatus(flagship.slug, todayKey),
    getServerProfile(),
    getPendingChallenges().catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Countrivo Geography Games",
            numberOfItems: allGames.length,
            itemListElement: allGames.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: g.title,
              url: `https://countrivo.com${g.route}`,
            })),
          }),
        }}
      />

      {/* Daily Challenge Hero — THE dominant element */}
      <DailyHero
        flagshipRoute={flagship.route}
        flagshipSlug={flagship.slug}
        serverPlayedToday={dailyStatus.played}
        serverStreak={profile?.streakCurrent ?? null}
      />

      {/* Pending challenges */}
      {pendingChallenges.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-extrabold">Challenges waiting for you</h2>
            <Pill variant="gold">{pendingChallenges.length}</Pill>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingChallenges.slice(0, 4).map((c) => {
              const colors = GAME_COLORS[c.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
              return (
                <Link
                  key={c.id}
                  href={`/games/${c.gameSlug}/play?mode=daily`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:scale-[1.01] transition-all"
                  style={{ backgroundColor: colors.bg }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: colors.text }}>
                      {c.challengerProfile?.displayName ?? c.challengerProfile?.username ?? "A friend"} challenged you
                    </p>
                    <p className="text-xs opacity-60 truncate" style={{ color: colors.text }}>
                      {c.gameSlug.replace(/-/g, " ")}
                      {c.challengerScore ? ` · ${c.challengerScore}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/60 shrink-0" style={{ color: colors.text }}>
                    Play →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Today's featured game — the daily game briefing */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-extrabold">Today&apos;s featured game</h2>
          <span className="px-2 py-0.5 bg-gold text-white text-xxs font-bold uppercase rounded-md tracking-wide">
            Flagship
          </span>
        </div>
        <Link
          href={dailyStatus.played ? flagship.route : `${flagship.route}/play?mode=daily`}
          className="group relative block rounded-2xl p-5 sm:p-6 transition-all hover:scale-[1.01] hover:shadow-lg overflow-hidden"
          style={{
            backgroundColor: GAME_COLORS[flagship.slug]?.bg ?? "#f3f4f6",
          }}
        >
          <span className="absolute -right-4 -bottom-4 text-[6rem] sm:text-[8rem] opacity-[0.10] select-none pointer-events-none leading-none">
            {flagship.emoji}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-md">
              <h3
                className="text-xl sm:text-2xl font-extrabold leading-tight"
                style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
              >
                {flagship.emoji} {flagship.title}
              </h3>
              <p
                className="mt-1.5 text-sm opacity-70 leading-relaxed"
                style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
              >
                {dailyStatus.played
                  ? `You scored ${dailyStatus.run?.scoreDisplay ?? "—"}. ${dailyStatus.run?.rankDaily ? `Rank #${dailyStatus.run.rankDaily} today.` : ""}`
                  : flagship.shortDescription}
              </p>
              <div
                className="mt-2 flex items-center gap-2 text-xxs"
                style={{ color: GAME_COLORS[flagship.slug]?.text ?? "#374151" }}
              >
                {dailyStatus.played ? (
                  <span className="px-1.5 py-0.5 bg-black/10 rounded-full font-bold">Played</span>
                ) : (
                  <>
                    <span className="px-1.5 py-0.5 bg-black/5 rounded-full font-medium capitalize">{flagship.difficulty}</span>
                    <span className="opacity-60">{flagship.estimatedTime}</span>
                  </>
                )}
                <span className="px-1.5 py-0.5 bg-black/5 rounded-full capitalize">{flagship.category}</span>
              </div>
            </div>
            <span className="cta-primary text-sm px-5 py-2.5 min-h-11 shrink-0">
              {dailyStatus.played ? "View result" : "Play now"} <IconArrowRight width={14} height={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* Real leaderboard teaser */}
      <section className="mb-8 p-4 rounded-xl bg-surface-elevated border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Today&apos;s leaderboard</h2>
          <Link href="/categories" className="cta-tertiary text-xs">
            See all rankings →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-white">
            <div className="text-xl mb-1">🥇</div>
            <div className="text-xs font-bold text-gold">Top score</div>
            <div className="text-lg font-extrabold font-mono">
              {summary.topScoreDisplay ?? "—"}
            </div>
            <div className="text-xxs text-cream-muted">
              {summary.playerCount > 0 ? "today's best" : "be the first"}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white">
            <div className="text-xl mb-1">👥</div>
            <div className="text-xs font-bold">Players today</div>
            <div className="text-lg font-extrabold font-mono">
              {summary.playerCount > 0 ? summary.playerCount : "—"}
            </div>
            <div className="text-xxs text-cream-muted">
              {summary.playerCount > 0 ? "and counting" : "play to join"}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white">
            <div className="text-xl mb-1">🎯</div>
            <div className="text-xs font-bold">Avg score</div>
            <div className="text-lg font-extrabold font-mono">
              {summary.playerCount > 0 ? Math.round(summary.avgScore) : "—"}
            </div>
            <div className="text-xxs text-cream-muted">
              {summary.playerCount > 0 ? "can you beat it?" : "play to set it"}
            </div>
          </div>
        </div>
      </section>

      {/* Main daily games grid — only the VERDICT-approved games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">More daily games</h2>
          <Link href="/games" className="cta-tertiary text-xs">
            All {allGames.length} games →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {mainNonFlagship.map((game) => {
            const colors = GAME_COLORS[game.slug] ?? {
              bg: "#f3f4f6",
              text: "#374151",
            };
            return (
              <Link
                key={game.slug}
                href={game.route}
                className="group relative game-card p-4 sm:p-5 overflow-hidden"
                style={{ backgroundColor: colors.bg }}
              >
                <span className="absolute -right-2 -bottom-2 text-[3.5rem] opacity-[0.12] select-none pointer-events-none leading-none">
                  {game.emoji}
                </span>
                {game.isNew && (
                  <span
                    className="absolute top-3 right-3 px-2 py-0.5 bg-black/10 text-xxs font-bold uppercase rounded-full"
                    style={{ color: colors.text }}
                  >
                    New
                  </span>
                )}
                <span className="text-2xl block mb-2">{game.emoji}</span>
                <h3
                  className="font-bold text-base leading-tight"
                  style={{ color: colors.text }}
                >
                  {game.title}
                </h3>
                <p
                  className="mt-1 text-sm leading-snug opacity-60"
                  style={{ color: colors.text }}
                >
                  {game.shortDescription}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className="text-xxs font-medium px-1.5 py-0.5 rounded-full bg-black/5 capitalize"
                    style={{ color: colors.text }}
                  >
                    {game.difficulty}
                  </span>
                  <span
                    className="text-xxs opacity-50"
                    style={{ color: colors.text }}
                  >
                    {game.estimatedTime}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Drills — reduced prominence, compact list-style cards */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-cream-muted">
              Drills
            </h2>
            <p className="text-xs text-cream-muted mt-0.5">
              Quick practice rounds. No daily ritual.
            </p>
          </div>
          <Link href="/games?show=drills" className="cta-tertiary text-xs">
            See all {drillGames.length} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {drillGames.slice(0, 8).map((game) => (
            <Link
              key={game.slug}
              href={game.route}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-cream-muted transition-colors"
            >
              <span className="text-lg shrink-0">{game.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{game.title}</div>
                <div className="text-xxs text-cream-muted truncate">
                  {game.estimatedTime}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
