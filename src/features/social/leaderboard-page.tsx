import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyLeaderboard, getDailySummary } from "@/app/actions/game-runs";
import { getFriends, getFriendsLeaderboard } from "@/app/actions/friends";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getGameBySlug } from "@/lib/data/registry";
import { createClient } from "@/lib/supabase/server";
import { getSilhouettePath, iso2ToIso3, toFlagCode } from "@/lib/silhouettes";
import { compactScore } from "@/server/boards";
import { getEdition } from "@/server/edition";
import { resolveShot } from "@/server/shot";
import { getViewer } from "@/server/viewer";
import type { LeaderboardEntry } from "@/types/server";
import { Board, Mark, Nudge, isGameSlug, type BoardData, type BoardRowWithRun, type BoardTab, type FriendRowWithRun } from "@/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/ui/icons";
import "./social.css";

export interface LeaderboardPageProps {
  slug: string;
  date?: string;
  tab?: string;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** `Wed 27 Aug`. Midday UTC keeps the day stable in every zone. */
export function shortDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** `2026-08-28` shifted by whole days. */
export function shiftDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The day's board (blueprint 7.6): the game title, the day row with its facts, the open-shot
 * nudge and the one Board with 50 rows on both tabs. Dynamic and noindex; every row links to
 * its run page.
 */
export async function LeaderboardPage({ slug, date, tab }: LeaderboardPageProps) {
  const game = getGameBySlug(slug);
  if (!game || !isGameSlug(slug)) notFound();

  const todayKey = getTodayDateKey();
  const dateKey = date && DATE_KEY.test(date) && date <= todayKey ? date : todayKey;
  const isToday = dateKey === todayKey;
  const initialTab: BoardTab = tab === "friends" ? "friends" : "global";

  const viewer = await getViewer();
  const [global, friendRuns, friendList, summary, edition, jar] = await Promise.all([
    getDailyLeaderboard(slug, dateKey, 50),
    viewer.signedIn ? getFriendsLeaderboard(slug, dateKey) : Promise.resolve([] as LeaderboardEntry[]),
    viewer.signedIn ? getFriends() : Promise.resolve([]),
    getDailySummary(slug, dateKey),
    getEdition(),
    cookies(),
  ]);

  /* One profiles read for the identity of every row: flags on the global tab, crests on the
     friends tab (blueprint 5.2). getDailyLeaderboard does not carry country_code. */
  const ids = Array.from(new Set([...global.map((r) => r.userId), ...friendRuns.map((r) => r.userId)]));
  const countryById = new Map<string, string | null>();
  if (ids.length > 0) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("profiles").select("id, country_code").in("id", ids);
      for (const p of data ?? []) countryById.set(p.id as string, (p.country_code as string | null) ?? null);
    } catch (err) {
      console.error("[leaderboard] country read failed", err);
    }
  }

  const meId = viewer.user?.id ?? null;
  const globalRows: BoardRowWithRun[] = global.map((e, i) => {
    const country = countryById.get(e.userId) ?? null;
    return {
      userId: e.userId,
      name: e.displayName || e.username,
      flag: toFlagCode(country),
      crest: getSilhouettePath(iso2ToIso3(country)),
      score: compactScore(e.scoreDisplay, e.scoreRaw),
      sort: e.scoreSortValue,
      rank: e.rankDaily ?? i + 1,
      isMe: e.userId === meId,
      runId: e.runId,
    };
  });
  const mine = globalRows.find((r) => r.isMe) ?? null;

  /* The friends tab lists every friend, not only those who shot: the ones still out wear the
     wait crest and read `not yet` (blueprint 3.7). Run ids come from the friends board. */
  const runByUser = new Map(friendRuns.map((r) => [r.userId, r]));
  const friendRows: FriendRowWithRun[] = [];
  const meRun = runByUser.get(meId ?? "");
  if (viewer.signedIn) {
    friendRows.push({
      userId: meId ?? "me",
      name: "you",
      crest: viewer.crest,
      score: meRun ? compactScore(meRun.scoreDisplay, meRun.scoreRaw) : null,
      sort: meRun ? meRun.scoreSortValue : null,
      isMe: true,
      runId: meRun?.runId ?? null,
    });
    for (const f of friendList) {
      const run = runByUser.get(f.profile.id);
      friendRows.push({
        userId: f.profile.id,
        name: f.profile.displayName || f.profile.username,
        crest: getSilhouettePath(iso2ToIso3(f.profile.countryCode)),
        score: run ? compactScore(run.scoreDisplay, run.scoreRaw) : null,
        sort: run ? run.scoreSortValue : null,
        isMe: false,
        runId: run?.runId ?? null,
      });
    }
    friendRows.sort((a, b) => (b.sort ?? -Infinity) - (a.sort ?? -Infinity));
  }

  const shots = summary.playerCount || global.length;
  const board: BoardData = {
    slug,
    shots,
    top: summary.topScoreDisplay ? compactScore(summary.topScoreDisplay, summary.topScoreRaw ?? 0) : null,
    global: globalRows,
    me: mine ? { rank: mine.rank, score: mine.score } : null,
    friends: friendRows,
  };

  const shot = isToday ? await resolveShot(slug, dateKey, edition, viewer, jar) : null;
  const showNudge = isToday && !shot && !mine;

  const facts: string[] = [isToday ? "Today's board" : shortDate(dateKey)];
  if (shots === 0) facts.push("no shots yet");
  else {
    facts.push(shots === 1 ? "1 shot" : `${shots} shots`);
    if (board.top) facts.push(`top ${board.top}`);
    if (summary.avgScore > 0) facts.push(`avg ${Math.round(summary.avgScore)}`);
  }

  const tabQuery = initialTab === "friends" ? "&tab=friends" : "";
  const prevKey = shiftDateKey(dateKey, -1);
  const nextKey = shiftDateKey(dateKey, 1);
  const canGoForward = nextKey <= todayKey;

  return (
    <div className="col-640">
      <div className="lb-head">
        <Mark slug={slug} size={26} />
        <h1 className="t-h1">{game.title}</h1>
      </div>
      <nav className="lb-days t-meta" aria-label="Pick a day">
        <Link href={`/games/${slug}/leaderboard?date=${prevKey}${tabQuery}`} aria-label={`Board for ${shortDate(prevKey)}`}>
          <ChevronLeftIcon size={20} />
        </Link>
        <p className="facts num">{facts.join(" · ")}</p>
        {canGoForward ? (
          <Link href={`/games/${slug}/leaderboard?date=${nextKey}${tabQuery}`} aria-label={`Board for ${shortDate(nextKey)}`}>
            <ChevronRightIcon size={20} />
          </Link>
        ) : (
          <span className="step" role="link" aria-disabled="true" aria-label="No board after today">
            <ChevronRightIcon size={20} />
          </span>
        )}
      </nav>
      {showNudge ? (
        <Nudge className="lb-nudge" action={{ label: "Shoot", href: `/games/${slug}/play?mode=daily`, prefetch: true }}>
          Your shot is still open.
        </Nudge>
      ) : null}
      {shots === 0 && !isToday ? (
        <p className="empty-row t-body">No shots on this day.</p>
      ) : (
      <Board
        slug={slug}
        title={game.title}
        board={board}
        viewer={viewer}
        initialTab={initialTab}
        hrefFull={`/games/${slug}/leaderboard`}
        limit={50}
        foot={false}
      />
      )}
    </div>
  );
}
