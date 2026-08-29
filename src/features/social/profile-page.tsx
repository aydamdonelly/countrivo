import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getHeadToHead, getProfileTodayRuns, getPublicProfile } from "@/app/actions/profile";
import { dailyMetas } from "@/features/play/server";
import { ADMIN_USER_ID } from "@/lib/admin";
import { countries as ALL_COUNTRIES } from "@/lib/data/loader";
import { getAllGames, getGameBySlug } from "@/lib/data/registry";
import { createClient } from "@/lib/supabase/server";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import { bestLabel } from "@/server/home-lists";
import { getClock } from "@/server/clock";
import { getViewer } from "@/server/viewer";
import type { Profile } from "@/types/server";
import { Button, GameList, GameRow, SectionHead, StreakWeek, isGameSlug, type GameSlug, type WeekDay } from "@/ui";
import { RerollButton } from "@/features/admin/reroll-button";
import { friendshipWith } from "./friendship";
import { HeadToHead } from "./head-to-head";
import { ProfileEdit, SignOutButton, type CountryOption } from "./profile-edit";
import { ProfileHead } from "./profile-head";
import { SoundRow } from "./sound-row";
import { DeleteAccount } from "./delete-account";
import { shotScore } from "./labels";
import "./social.css";

interface TodayShot {
  slug: GameSlug;
  title: string;
  meta: string;
}

interface GameStat {
  slug: GameSlug;
  title: string;
  meta: string;
}

/** `Mo`, `Tu`: two letters, unique across a trailing week. */
function dayLetters(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2);
}

function shiftKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The seven trailing days and how many dailies were shot on each (blueprint 3.12). */
async function streakWeek(userId: string, todayKey: string, total: number): Promise<WeekDay[]> {
  const keys = Array.from({ length: 7 }, (_, i) => shiftKey(todayKey, i - 6));
  const counts = new Map<string, number>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("game_runs")
      .select("daily_date")
      .eq("user_id", userId)
      .eq("mode", "daily")
      .gte("daily_date", keys[0])
      .lte("daily_date", todayKey);
    for (const row of data ?? []) {
      const key = row.daily_date as string;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  } catch (err) {
    console.error("[profile] week read failed", err);
  }
  /* A day with no shot carries no counter at all (blueprint 3.12: the `4/12` belongs to the
     days that were played); the tile is then just the letter. */
  return keys.map((key) => ({ label: dayLetters(key), played: counts.get(key) ?? null, total, today: key === todayKey }));
}

/** `612 · #9 of 41` (blueprint 10.4). */
function todayMeta(score: string, rank: number | null, shots: number): string {
  const parts = [score];
  if (rank !== null && shots > 0) parts.push(`#${rank} of ${shots}`);
  else if (rank !== null) parts.push(`#${rank}`);
  return parts.join(" · ");
}

async function todayShots(userId: string, dateKey: string): Promise<TodayShot[]> {
  const [runs, metas] = await Promise.all([getProfileTodayRuns(userId), dailyMetas(dateKey)]);
  return runs
    .filter((r) => isGameSlug(r.gameSlug))
    .map((r) => {
      const slug = r.gameSlug as GameSlug;
      return {
        slug,
        title: getGameBySlug(slug)?.title ?? slug,
        meta: todayMeta(shotScore(r.scoreDisplay), r.rankDaily, metas[slug]?.shots ?? 0),
      };
    });
}

function gameStats(stats: readonly { gameSlug: string; totalRuns: number; bestScoreRaw: number; bestScoreMax: number }[]): GameStat[] {
  return stats
    .filter((s) => isGameSlug(s.gameSlug))
    .map((s) => {
      const slug = s.gameSlug as GameSlug;
      return {
        slug,
        title: getGameBySlug(slug)?.title ?? slug,
        meta: `${s.totalRuns} ${s.totalRuns === 1 ? "run" : "runs"} · best ${bestLabel(slug, s.bestScoreRaw, s.bestScoreMax)}`,
      };
    });
}

/** Today, Numbers and Games: the same three blocks on both profiles. */
function Today({ shots, own }: { shots: readonly TodayShot[]; own: boolean }) {
  return (
    <GameList title="Today" fact={shots.length > 0 ? `${shots.length} ${shots.length === 1 ? "shot" : "shots"}` : undefined} live={shots.length > 0}>
      {shots.map((s) => (
        <GameRow key={s.slug} slug={s.slug} title={s.title} meta={s.meta} href={`/games/${s.slug}/leaderboard`} prefetch={false} />
      ))}
      {shots.length === 0 ? (
        <p className="empty-row t-body">
          {own ? (
            <>
              No shot yet today.{" "}
              <Link href="/games/country-draft/play?mode=daily" prefetch>
                Shoot
              </Link>
            </>
          ) : (
            "No shot yet today."
          )}
        </p>
      ) : null}
    </GameList>
  );
}

function Numbers({ runs, dailies, games }: { runs: number; dailies: number; games: number }) {
  return (
    <section className="sec">
      <SectionHead title="Numbers" />
      <p className="line t-body">
        <b className="num">{runs}</b> {runs === 1 ? "run" : "runs"} · <b className="num">{dailies}</b>{" "}
        {dailies === 1 ? "daily" : "dailies"} · <b className="num">{games}</b> {games === 1 ? "game" : "games"}
      </p>
    </section>
  );
}

function Games({ stats }: { stats: readonly GameStat[] }) {
  if (stats.length === 0) return null;
  return (
    <GameList title="Games" fact={`${stats.length} ${stats.length === 1 ? "game" : "games"}`}>
      {stats.map((s) => (
        <GameRow key={s.slug} slug={s.slug} title={s.title} meta={s.meta} href={`/games/${s.slug}`} />
      ))}
    </GameList>
  );
}

const DAILY_TOTAL = getAllGames().filter((g) => g.availableModes.includes("daily")).length;

/** iso3, iso2 and the display name of every country, for the profile select. */
function countryOptions(): CountryOption[] {
  return ALL_COUNTRIES.map((c) => ({ iso3: c.iso3, iso2: c.iso2, name: c.displayName })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The viewer's own profile (blueprint 7.16): the hero, the streak week, today's shots, the
 * numbers, the per-game bests, the two forms, sound, sign out and account deletion.
 */
export async function OwnProfilePage() {
  const viewer = await getViewer();
  if (!viewer.signedIn || !viewer.user || !viewer.profile) redirect("/");

  const clock = await getClock();
  const profile: Profile = viewer.profile;
  const [data, shots, week] = await Promise.all([
    getPublicProfile(profile.username),
    todayShots(viewer.user.id, clock.dateKey),
    streakWeek(viewer.user.id, clock.dateKey, DAILY_TOTAL),
  ]);
  if (!data) redirect("/");

  const stats = gameStats(data.gameStats);
  return (
    <>
      <ProfileHead
        name={profile.displayName || profile.username}
        username={profile.username}
        crest={viewer.crest}
        streak={profile.streakCurrent}
        longest={profile.streakLongest}
        own
        hasCountry={Boolean(profile.countryCode)}
        weekFollows
      />
      <div className="frame-app social-grid">
        <div className="col">
          <section className="sec">
            <SectionHead title="Streak" fact={profile.streakLongest > 0 ? `best ${profile.streakLongest}` : undefined} />
            <StreakWeek n={profile.streakCurrent} days={week} />
          </section>
          <Today shots={shots} own />
          <Numbers runs={data.totalRuns} dailies={data.totalDailyRuns} games={data.gameStats.length} />
        </div>
        {/* On a phone this follows the day; on desktop it is the rail beside it. */}
        <div className="rail">
          <Games stats={stats} />
        </div>
        <div className="col">
          <SectionHead title="Your profile" />
          <ProfileEdit
            username={profile.username}
            displayName={profile.displayName ?? ""}
            countryCode={profile.countryCode ?? ""}
            countries={countryOptions()}
          />
          <SoundRow />
          <SignOutButton />
          <DeleteAccount />
          {viewer.user.id === ADMIN_USER_ID ? <RerollButton /> : null}
        </div>
      </div>
    </>
  );
}

/**
 * Someone else's profile (blueprint 7.16): the same hero and blocks, an Add as friend link
 * when you are signed in and not friends yet, and the head-to-head of the same dailies.
 */
export async function PublicProfilePage({ username }: { username: string }) {
  const viewer = await getViewer();
  if (viewer.profile?.username === username) redirect("/profile");

  const data = await getPublicProfile(username);
  if (!data) notFound();
  const { profile } = data;

  const clock = await getClock();
  const [shots, h2h, friendship] = await Promise.all([
    todayShots(profile.id, clock.dateKey),
    viewer.user ? getHeadToHead(viewer.user.id, profile.id) : Promise.resolve(null),
    viewer.user ? friendshipWith(viewer.user.id, profile.id) : Promise.resolve<"none">("none"),
  ]);

  return (
    <>
      <ProfileHead
        name={profile.displayName || profile.username}
        username={profile.username}
        crest={getSilhouettePath(iso2ToIso3(profile.countryCode))}
        streak={profile.streakCurrent}
        longest={profile.streakLongest}
      />
      {viewer.signedIn && friendship === "none" ? (
        <div className="profile-cta">
          <Button href={`/friends/add/${profile.username}`}>Add as friend</Button>
        </div>
      ) : null}
      <div className="frame-app social-grid">
        <div className="col">
          <Today shots={shots} own={false} />
          <Numbers runs={data.totalRuns} dailies={data.totalDailyRuns} games={data.gameStats.length} />
        </div>
        <div className="rail">
          <Games stats={gameStats(data.gameStats)} />
          {h2h ? <HeadToHead wins={h2h.wins} losses={h2h.losses} draws={h2h.draws} recent={h2h.recent} /> : null}
        </div>
      </div>
    </>
  );
}
