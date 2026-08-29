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
import { SignedOut } from "@/features/social/signed-out";
import { getViewer } from "@/server/viewer";
import type { Profile } from "@/types/server";
import { Button, GAME_SLUGS, GameList, GameRow, PageTitle, SectionHead, StreakWeek, isGameSlug, type GameSlug, type WeekDay } from "@/ui";
import { RerollButton } from "@/features/admin/reroll-button";
import { friendshipWith } from "./friendship";
import { HeadToHead } from "./head-to-head";
import { anchorPlayHref } from "./links";
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

/** The three Numbers and the per-game rows, all counted over the same roster-only rows. */
interface History {
  runs: number;
  dailies: number;
  games: GameStat[];
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
      /* Runs of the games that were cut are still in the table; counting them would put a
         day over the `n/6` it is measured against. */
      .in("game_slug", [...GAME_SLUGS])
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

interface StatsRow {
  game_slug: string;
  total_runs: number | null;
  total_daily_runs: number | null;
  best_score_raw: number | null;
  best_score_max: number | null;
}

/**
 * Lifetime history over the seven registry games. `user_game_stats` still holds rows for the
 * games that were cut, and those rows are dropped here BEFORE anything is counted, so the
 * Numbers line and the Games list below it can never disagree (a profile used to read
 * `44 runs · 9 games` above a list of five).
 */
async function history(userId: string): Promise<History> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_game_stats")
      .select("game_slug, total_runs, total_daily_runs, best_score_raw, best_score_max")
      .eq("user_id", userId)
      .order("total_runs", { ascending: false });
    const out: History = { runs: 0, dailies: 0, games: [] };
    for (const row of (data ?? []) as StatsRow[]) {
      if (!isGameSlug(row.game_slug)) continue;
      const slug = row.game_slug;
      const runs = row.total_runs ?? 0;
      out.runs += runs;
      out.dailies += row.total_daily_runs ?? 0;
      out.games.push({
        slug,
        title: getGameBySlug(slug)?.title ?? slug,
        meta: `${runs} ${runs === 1 ? "run" : "runs"} · best ${bestLabel(slug, Number(row.best_score_raw ?? 0), Number(row.best_score_max ?? 0))}`,
      });
    }
    return out;
  } catch (err) {
    console.error("[profile] history read failed", err);
    return { runs: 0, dailies: 0, games: [] };
  }
}

/** Today, Numbers and Games: the same three blocks on both profiles. */
function Today({ shots, own, shootHref }: { shots: readonly TodayShot[]; own: boolean; shootHref: string | null }) {
  return (
    <GameList title="Today" fact={shots.length > 0 ? `${shots.length} ${shots.length === 1 ? "shot" : "shots"}` : undefined} live={shots.length > 0}>
      {shots.map((s) => (
        <GameRow key={s.slug} slug={s.slug} title={s.title} meta={s.meta} href={`/games/${s.slug}/leaderboard`} prefetch={false} />
      ))}
      {shots.length === 0 ? (
        <p className="empty-row t-body">
          {own && shootHref ? (
            <>
              No shot yet today.{" "}
              <Link href={shootHref} prefetch>
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
  if (!viewer.signedIn || !viewer.user || !viewer.profile) {
    return (
      <>
        <PageTitle title="You" />
        <SignedOut line="Your streak, your crest and every shot you have taken live here." reason="profile" />
      </>
    );
  }

  const clock = await getClock();
  const profile: Profile = viewer.profile;
  const [past, shots, week] = await Promise.all([
    history(viewer.user.id),
    todayShots(viewer.user.id, clock.dateKey),
    streakWeek(viewer.user.id, clock.dateKey, DAILY_TOTAL),
  ]);
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
          <Today shots={shots} own shootHref={anchorPlayHref()} />
          <Numbers runs={past.runs} dailies={past.dailies} games={past.games.length} />
        </div>
        {/* On a phone this follows the day; on desktop it is the rail beside it. */}
        <div className="rail">
          <Games stats={past.games} />
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
  const [past, shots, h2h, friendship] = await Promise.all([
    history(profile.id),
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
          <Today shots={shots} own={false} shootHref={null} />
          <Numbers runs={past.runs} dailies={past.dailies} games={past.games.length} />
        </div>
        <div className="rail">
          <Games stats={past.games} />
          {h2h ? <HeadToHead wins={h2h.wins} losses={h2h.losses} draws={h2h.draws} recent={h2h.recent} /> : null}
        </div>
      </div>
    </>
  );
}
