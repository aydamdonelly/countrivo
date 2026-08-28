import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile, getProfileTodayRuns } from "@/app/actions/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { AdminRerollButton } from "@/components/admin/admin-reroll-button";
import { ADMIN_USER_ID } from "@/lib/admin";
import { GameMark } from "@/components/home/game-mark";
import { getGameBySlug } from "@/lib/data/registry";
import { Flame } from "@/components/home/flame";
import { Crest } from "@/components/home/silhouette";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // The root layout applies the "%s | Countrivo" template — never repeat the
  // brand here or the <title> ends up "My Profile | Countrivo | Countrivo".
  title: "My Profile",
  description: "View and edit your Countrivo profile, stats, and streaks.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!rawProfile) redirect("/");

  const [data, todayRuns] = await Promise.all([
    getPublicProfile(rawProfile.username),
    getProfileTodayRuns(user.id),
  ]);
  if (!data) redirect("/");

  const { profile, gameStats, totalRuns, totalDailyRuns } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <Crest d={getSilhouettePath(iso2ToIso3(profile.countryCode))} label={profile.displayName ?? profile.username} size={64} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-[26px] leading-tight truncate">{profile.displayName ?? profile.username}</h1>
          <p className="text-sm text-cream-muted">@{profile.username}{!profile.countryCode && <> · <span className="text-cream">pick a country below to get your crest</span></>}</p>
          <p className="flex items-center gap-1.5 text-sm mt-1">
            <Flame size={16} className={profile.streakCurrent > 0 ? "text-gold" : "text-cream-dim"} />
            {profile.streakCurrent > 0 ? (
              <span className="font-semibold tabular-nums">
                {profile.streakCurrent} day streak
                <span className="text-cream-muted font-normal ml-1">(best {profile.streakLongest})</span>
              </span>
            ) : (
              <span className="text-cream-muted">No streak yet. One daily shot starts it.</span>
            )}
          </p>
        </div>
      </div>

      {user.id === ADMIN_USER_ID && (
        <section className="mb-8">
          <AdminRerollButton />
        </section>
      )}

      {/* Edit form */}
      <section className="mb-8">
        <h2 className="text-xs text-cream-muted mb-2">Edit profile</h2>
        <ProfileEditForm
          initialUsername={profile.username}
          initialDisplayName={profile.displayName ?? ""}
          initialCountryCode={profile.countryCode ?? ""}
        />
      </section>

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
        <section>
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
