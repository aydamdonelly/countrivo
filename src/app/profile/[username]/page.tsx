import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile, getProfileTodayRuns, getHeadToHead } from "@/app/actions/profile";
import { GameMark } from "@/components/home/game-mark";
import { getGameBySlug } from "@/lib/data/registry";
import { Flame } from "@/components/home/flame";
import { Crest } from "@/components/home/silhouette";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}`,
    description: `View ${username}'s Countrivo profile and game stats.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  // If viewing own profile, redirect to /profile
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (myProfile?.username === username) {
      redirect("/profile");
    }
  }

  const data = await getPublicProfile(username);
  if (!data) notFound();

  const { profile, gameStats, totalRuns, totalDailyRuns } = data;

  const [todayRuns, h2h] = await Promise.all([
    getProfileTodayRuns(profile.id),
    user ? getHeadToHead(user.id, profile.id) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <Crest d={getSilhouettePath(iso2ToIso3(profile.countryCode))} label={profile.displayName ?? profile.username} size={64} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-[26px] leading-tight truncate">{profile.displayName ?? profile.username}</h1>
          <p className="text-sm text-cream-muted">@{profile.username}</p>
          <p className="flex items-center gap-1.5 text-sm mt-1">
            <Flame size={16} className={profile.streakCurrent > 0 ? "text-gold" : "text-cream-dim"} />
            {profile.streakCurrent > 0 ? (
              <span className="font-semibold tabular-nums">{profile.streakCurrent} day streak</span>
            ) : (
              <span className="text-cream-muted">No streak yet</span>
            )}
          </p>
        </div>
      </div>

      {/* Stats overview */}
      <section className="mb-8">
        <h2 className="text-xs text-cream-muted mb-2">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Games played" value={String(totalRuns)} />
          <StatCard label="Daily challenges" value={String(totalDailyRuns)} />
          <StatCard label="Longest streak" value={`${profile.streakLongest} ${profile.streakLongest === 1 ? "day" : "days"}`} />
        </div>
      </section>

      {/* Per-game stats */}
      {gameStats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs text-cream-muted mb-2">Games</h2>
          <div className="space-y-2">
            {gameStats.map((s) => (
              <Link
                key={s.gameSlug}
                href={`/games/${s.gameSlug}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:bg-surface-sunken transition-colors"
              >
                <GameMark slug={s.gameSlug} size={28} className="shrink-0 text-cream" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getGameBySlug(s.gameSlug)?.title ?? s.gameSlug.replace(/-/g, " ")}</p>
                  <p className="text-xs text-cream-muted tabular-nums">
                    {s.totalRuns} {s.totalRuns === 1 ? "run" : "runs"} · best {s.bestScoreRaw}/{s.bestScoreMax}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Today's dailies */}
      {todayRuns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs text-cream-muted mb-2">Today</h2>
          <div className="flex flex-wrap gap-2">
            {todayRuns.map((r) => (
              <Link
                key={r.gameSlug}
                href={`/games/${r.gameSlug}/leaderboard`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-surface-elevated hover:bg-surface-sunken transition-colors"
              >
                <GameMark slug={r.gameSlug} size={18} className="shrink-0 text-cream" />
                <span className="font-semibold">{getGameBySlug(r.gameSlug)?.title ?? r.gameSlug.replace(/-/g, " ")}</span>
                <span className="text-cream-muted tabular-nums">{r.scoreDisplay}</span>
                {r.rankDaily != null && <span className="text-cream-dim tabular-nums">#{r.rankDaily}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Head-to-head */}
      {h2h && (h2h.wins + h2h.losses + h2h.draws) > 0 && (
        <section className="mb-8">
          <h2 className="text-xs text-cream-muted mb-2">Same dailies, last 30 days</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-surface-elevated text-center">
              <p className="font-display font-semibold text-2xl tabular-nums">{h2h.wins}</p>
              <p className="text-xs text-cream-muted mt-1">Wins</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated text-center">
              <p className="font-display font-semibold text-2xl tabular-nums">{h2h.draws}</p>
              <p className="text-xs text-cream-muted mt-1">Draws</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated text-center">
              <p className="font-display font-semibold text-2xl tabular-nums">{h2h.losses}</p>
              <p className="text-xs text-cream-muted mt-1">Losses</p>
            </div>
          </div>
          {h2h.recent.length > 0 && (
            <div className="space-y-1.5">
              {h2h.recent.map((r, i) => {
                const won = r.mySort > r.theirSort;
                const lost = r.mySort < r.theirSort;
                return (
                  <div key={`${r.gameSlug}-${r.dailyDate}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-elevated text-sm">
                    <span className="w-20 text-cream-muted text-xs">{r.dailyDate.slice(5)}</span>
                    <span className="font-medium truncate">{getGameBySlug(r.gameSlug)?.title ?? r.gameSlug.replace(/-/g, " ")}</span>
                    <span className="ml-auto tabular-nums font-semibold">
                      <span className={won ? "text-correct" : lost ? "text-incorrect" : ""}>{r.myScore}</span>
                      <span className="text-cream-muted mx-1">vs</span>
                      <span>{r.theirScore}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Add friend CTA */}
      {user && (
        <div className="text-center">
          <Link
            href={`/friends/add/${profile.username}`}
            className="cta-primary inline-flex items-center justify-center gap-2 px-6 min-h-[44px] active:scale-[0.97]"
          >
            Add as friend
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-surface-elevated border border-border text-center">
      <p className="font-display font-semibold text-2xl tabular-nums">{value}</p>
      <p className="text-xs text-cream-muted mt-1">{label}</p>
    </div>
  );
}
