import { getDailyLeaderboard, getDailySummary } from "@/app/actions/game-runs";
import { getFriendsLeaderboard } from "@/app/actions/friends";
import { getGameBySlug } from "@/lib/data/games";
import { getTodayDateKey } from "@/lib/daily-seed";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GAME_COLORS } from "@/lib/game-colors";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  return {
    title: game ? `${game.title} Leaderboard` : "Leaderboard",
    description: game
      ? `Today's ${game.title} daily challenge leaderboard. See how you rank against other players.`
      : "Daily challenge leaderboard.",
  };
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date, tab } = await searchParams;
  const activeTab = tab === "friends" ? "friends" : "global";
  const game = getGameBySlug(slug);

  if (!game) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <Link href="/games" className="cta-tertiary mt-4">
          Back to games
        </Link>
      </div>
    );
  }

  const todayKey = getTodayDateKey();
  const dateKey = date ?? todayKey;
  const isToday = dateKey === todayKey;

  // Get yesterday for navigation
  const dateObj = new Date(dateKey + "T12:00:00Z");
  const yesterdayObj = new Date(dateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayKey = yesterdayObj.toISOString().slice(0, 10);
  const tomorrowObj = new Date(dateObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowKey = tomorrowObj.toISOString().slice(0, 10);
  const canGoForward = tomorrowKey <= todayKey;

  const [leaderboard, friendsLeaderboard, summary] = await Promise.all([
    getDailyLeaderboard(slug, dateKey, 50),
    activeTab === "friends" ? getFriendsLeaderboard(slug, dateKey) : Promise.resolve([]),
    getDailySummary(slug, dateKey),
  ]);

  const displayLeaderboard = activeTab === "friends" ? friendsLeaderboard : leaderboard;

  // Get current user ID for highlighting
  let currentUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  } catch { /* guest */ }

  const colors = GAME_COLORS[slug] ?? { bg: "#f3f4f6", text: "#374151" };

  const displayDate = new Date(dateKey + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/games/${slug}`}
          className="text-sm text-cream-muted hover:text-cream transition-colors"
        >
          ← {game.title}
        </Link>
      </div>

      <div
        className="rounded-2xl p-5 sm:p-6 mb-6"
        style={{ backgroundColor: colors.bg }}
      >
        <h1
          className="text-2xl sm:text-3xl font-extrabold"
          style={{ color: colors.text }}
        >
          {game.emoji} {game.title} Leaderboard
        </h1>
        <p className="text-sm mt-1 opacity-70" style={{ color: colors.text }}>
          {isToday ? "Today\u2019s daily challenge" : displayDate}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: colors.text }}>
          <span>
            <span className="font-bold">{summary.playerCount}</span> player{summary.playerCount !== 1 ? "s" : ""}
          </span>
          {summary.topScoreDisplay && (
            <span>
              Top: <span className="font-bold">{summary.topScoreDisplay}</span>
            </span>
          )}
          {summary.avgScore > 0 && (
            <span>
              Avg: <span className="font-bold">{Math.round(summary.avgScore)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/games/${slug}/leaderboard?date=${yesterdayKey}`}
          className="text-sm font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Previous day
        </Link>
        <span className="text-sm font-bold">
          {isToday ? "Today" : displayDate}
        </span>
        {canGoForward ? (
          <Link
            href={`/games/${slug}/leaderboard?date=${tomorrowKey}`}
            className="text-sm font-medium text-cream-muted hover:text-cream transition-colors"
          >
            Next day →
          </Link>
        ) : (
          <span className="text-sm text-cream-muted opacity-40">Next day →</span>
        )}
      </div>

      {/* Global / Friends tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-surface-elevated border border-border w-fit">
        <Link
          href={`/games/${slug}/leaderboard${date ? `?date=${date}` : ""}`}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "global" ? "bg-gold text-white" : "text-cream-muted hover:text-cream"
          }`}
        >
          Global
        </Link>
        <Link
          href={`/games/${slug}/leaderboard?${date ? `date=${date}&` : ""}tab=friends`}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "friends" ? "bg-gold text-white" : "text-cream-muted hover:text-cream"
          }`}
        >
          Friends
        </Link>
      </div>

      {/* Leaderboard table */}
      {displayLeaderboard.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">{activeTab === "friends" ? "👥" : game.emoji}</div>
          <p className="text-lg font-bold">
            {activeTab === "friends" ? "No friends have played yet" : "No one has played yet"}
          </p>
          <p className="text-sm text-cream-muted mt-1">
            {activeTab === "friends"
              ? "Challenge a friend to get started!"
              : isToday ? "Be the first to set a score today." : "No players on this date."}
          </p>
          {activeTab === "friends" ? (
            <Link href="/friends" className="cta-primary mt-4 text-sm">Find friends</Link>
          ) : isToday ? (
            <Link href={`/games/${slug}/play?mode=daily`} className="cta-primary mt-4 text-sm">Play now</Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayLeaderboard.map((entry) => {
            const isMe = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isMe
                    ? "bg-gold-dim border border-gold/20"
                    : "bg-surface-elevated border border-transparent"
                }`}
              >
                {/* Rank */}
                <span className={`w-8 text-center font-extrabold font-mono text-lg ${
                  entry.rankDaily === 1 ? "text-gold" :
                  entry.rankDaily === 2 ? "text-gray-400" :
                  entry.rankDaily === 3 ? "text-amber-700" : "text-cream-muted"
                }`}>
                  {entry.rankDaily}
                </span>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isMe ? "bg-gold text-white" : "bg-black/5 text-cream-muted"
                }`}>
                  {(entry.displayName ?? entry.username)?.[0]?.toUpperCase() ?? "?"}
                </div>

                {/* Name */}
                <Link href={`/profile/${entry.username}`} className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? "text-gold font-bold" : ""}`}>
                    {entry.displayName ?? entry.username}
                    {isMe && <span className="text-[10px] text-gold ml-1.5">(you)</span>}
                  </p>
                </Link>

                {/* Score */}
                <span className="font-mono font-bold text-sm shrink-0">
                  {entry.scoreDisplay ?? entry.scoreRaw}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Play CTA */}
      {isToday && !displayLeaderboard.some((e) => e.userId === currentUserId) && (
        <div className="mt-6 text-center">
          <Link href={`/games/${slug}/play?mode=daily`} className="cta-primary text-sm">
            Play today&apos;s challenge
          </Link>
        </div>
      )}
    </div>
  );
}
