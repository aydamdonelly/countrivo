import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile, getProfileTodayRuns, getHeadToHead } from "@/app/actions/profile";
import { GAME_COLORS } from "@/lib/game-colors";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | Countrivo`,
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
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {(profile.displayName ?? profile.username)[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold truncate">{profile.displayName ?? profile.username}</h1>
          <p className="text-sm text-cream-muted">@{profile.username}</p>
          {profile.streakCurrent > 0 && (
            <p className="text-sm text-gold font-bold mt-0.5">
              🔥 {profile.streakCurrent}-day streak
            </p>
          )}
        </div>
      </div>

      {/* Stats overview */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Games played" value={String(totalRuns)} />
          <StatCard label="Daily challenges" value={String(totalDailyRuns)} />
          <StatCard label="Longest streak" value={`${profile.streakLongest} days`} />
        </div>
      </section>

      {/* Per-game stats */}
      {gameStats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Games</h2>
          <div className="space-y-2">
            {gameStats.map((s) => {
              const colors = GAME_COLORS[s.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
              return (
                <div
                  key={s.gameSlug}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  style={{ backgroundColor: colors.bg }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm capitalize" style={{ color: colors.text }}>
                      {s.gameSlug.replace(/-/g, " ")}
                    </p>
                    <p className="text-xs opacity-70" style={{ color: colors.text }}>
                      {s.totalRuns} {s.totalRuns === 1 ? "run" : "runs"} · Best: {s.bestScoreRaw}/{s.bestScoreMax}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Today's dailies */}
      {todayRuns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Today</h2>
          <div className="flex flex-wrap gap-2">
            {todayRuns.map((r) => {
              const colors = GAME_COLORS[r.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
              return (
                <div key={r.gameSlug} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  <span className="capitalize">{r.gameSlug.replace(/-/g, " ")}</span>
                  <span className="opacity-70">{r.scoreDisplay}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Head-to-head */}
      {h2h && (h2h.wins + h2h.losses + h2h.draws) > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Head-to-head (30 days)</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-correct/10 border border-correct/20 text-center">
              <p className="text-xl font-extrabold font-mono text-correct">{h2h.wins}</p>
              <p className="text-xs text-cream-muted mt-1">Wins</p>
            </div>
            <div className="p-4 rounded-xl bg-gold-dim border border-gold/20 text-center">
              <p className="text-xl font-extrabold font-mono text-gold">{h2h.draws}</p>
              <p className="text-xs text-cream-muted mt-1">Draws</p>
            </div>
            <div className="p-4 rounded-xl bg-incorrect/10 border border-incorrect/20 text-center">
              <p className="text-xl font-extrabold font-mono text-incorrect">{h2h.losses}</p>
              <p className="text-xs text-cream-muted mt-1">Losses</p>
            </div>
          </div>
          {h2h.recent.length > 0 && (
            <div className="space-y-1.5">
              {h2h.recent.map((r, i) => {
                const colors = GAME_COLORS[r.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
                const won = r.mySort > r.theirSort;
                const lost = r.mySort < r.theirSort;
                return (
                  <div key={`${r.gameSlug}-${r.dailyDate}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-elevated text-sm">
                    <span className="w-20 text-cream-muted text-xs">{r.dailyDate.slice(5)}</span>
                    <span className="capitalize font-medium" style={{ color: colors.text }}>{r.gameSlug.replace(/-/g, " ")}</span>
                    <span className="ml-auto font-mono font-bold">
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

      {/* Add friend link */}
      {user && (
        <div className="text-center">
          <Link
            href="/friends"
            className="text-sm font-medium text-gold hover:underline"
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
      <p className="text-xl font-extrabold font-mono">{value}</p>
      <p className="text-xs text-cream-muted mt-1">{label}</p>
    </div>
  );
}
