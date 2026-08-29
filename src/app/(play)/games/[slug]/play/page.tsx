import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDailySummary } from "@/app/actions/game-runs";
import { getGameBySlug } from "@/lib/data/games";
import { dateSeed } from "@/lib/daily-seed";
import { getClock } from "@/server/clock";
import { getEdition } from "@/server/edition";
import { getPracticeMetas } from "@/server/home-lists";
import { readProgress } from "@/server/progress";
import { getTodayRun } from "@/server/runs";
import { resolveShots } from "@/server/shot";
import { getViewer } from "@/server/viewer";
import { Button } from "@/ui/button";
import { NextDailies } from "@/ui/next-dailies";
import { ResultPanel, type ResultRanks } from "@/ui/result-panel";
import type { Mode, Viewer } from "@/ui/types";
import { CODECS, HOSTS, isPlayable } from "@/games/registry";
import type { PlayViewer } from "@/games/types";
import { PlayFrame } from "@/features/play/play-frame";
import { dailyMetas, dailyRefs, getFriendsToday, nextDailyMeta } from "@/features/play/server";

/*
 * The one play route for the 17 playable games (blueprint 7.5, 8.1, 9.1 step 11). Mode,
 * edition, the seed, the viewer, the lockout and the resume log are resolved here, on the
 * server, so the first HTML is the board (or the lockout panel) and nothing swaps after
 * hydration. Guest daily budget: no DB work beyond the cached edition read.
 */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = getGameBySlug(slug);
  return { title: meta ? `${meta.title} · Play` : "Play", robots: { index: false, follow: true } };
}

function slim(viewer: Viewer): PlayViewer {
  return { signedIn: viewer.signedIn, name: viewer.name, crest: viewer.crest, streak: viewer.streak };
}

/** A per-request 31-bit seed for a practice board (blueprint 9.1 step 11). */
function practiceSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] >>> 1;
}

export default async function PlayPage({ params, searchParams }: Props) {
  const [{ slug }, { mode: modeParam }] = await Promise.all([params, searchParams]);
  if (!isPlayable(slug)) notFound();
  const meta = getGameBySlug(slug);
  if (!meta) notFound();
  const canDaily = meta.availableModes.includes("daily");
  const mode: Mode = modeParam === "daily" && canDaily ? "daily" : "practice";

  const [clock, edition, viewer, cookieStore] = await Promise.all([getClock(), getEdition(), getViewer(), cookies()]);
  const { dateKey } = clock;
  const Host = HOSTS[slug];
  const dailies = dailyRefs();
  const requestStartedAt = new Date(clock.now).toISOString();
  const common = {
    slug,
    title: meta.title,
    dateKey,
    edition,
    viewer: slim(viewer),
    resetAt: clock.resetAt,
    serverNow: clock.now,
    streakBefore: viewer.streak ?? 0,
    dailies,
  };

  if (mode === "practice") {
    const metas = viewer.user ? await getPracticeMetas(viewer) : {};
    return (
      <PlayFrame slug={slug} title={meta.title} mode="practice">
        <Host
          {...common}
          mode="practice"
          seed={practiceSeed()}
          log=""
          startedAt={requestStartedAt}
          friendsToday={null}
          friendCount={0}
          friendScores={[]}
          shots={null}
          practiceBest={metas[slug]?.best ?? null}
          shotToday={[]}
        />
      </PlayFrame>
    );
  }

  // Daily: the viewer's shot today (server run when signed in, the done cookie for guests).
  const shots = await resolveShots(dateKey, edition, viewer, cookieStore);
  const shot = shots[slug];
  const shotToday = Object.keys(shots);

  if (shot) {
    const [metas, friends, summary, run] = await Promise.all([
      dailyMetas(dateKey),
      viewer.user ? getFriendsToday(viewer.user.id, slug, dateKey) : null,
      viewer.user ? getDailySummary(slug, dateKey).catch(() => null) : null,
      viewer.user ? getTodayRun(viewer.user.id, slug, dateKey) : null,
    ]);
    const done = new Set([...shotToday, slug]);
    const rows = dailies.filter((d) => !done.has(d.slug)).map((d) => ({ slug: d.slug, title: d.title, meta: nextDailyMeta(metas[d.slug]) }));
    const ranks: ResultRanks | undefined = run
      ? {
          globalRank: run.rankDaily,
          globalShots: Math.max(summary?.playerCount ?? 0, run.rankDaily ?? 0, 1),
          friendRank: friends && friends.friendCount > 0 ? 1 + friends.scores.filter((s) => s > run.scoreSortValue).length : null,
          friendCount: friends?.friendCount ?? 0,
        }
      : undefined;
    return (
      <PlayFrame slug={slug} title={meta.title} mode="daily">
        <ResultPanel
          mode="lockout"
          game={meta.title}
          score={shot.scoreLabel}
          ranks={ranks}
          personalBest={shot.isPersonalBest === true}
          practiceHref={`/games/${slug}/play?mode=practice`}
          clock={{ resetAt: clock.resetAt, serverNow: clock.now }}
          actions={
            <>
              <Button variant="ink" href={`/games/${slug}/leaderboard`} prefetch>
                Today&apos;s board
              </Button>
              <Button variant="text" href={`/games/${slug}/play?mode=practice`} prefetch>
                Practice a board
              </Button>
            </>
          }
        />
        <NextDailies rows={rows} shot={dailies.filter((d) => done.has(d.slug)).length} total={dailies.length} />
      </PlayFrame>
    );
  }

  const progress = readProgress(cookieStore, slug, dateKey, edition, CODECS[slug]);
  const [friends, summary] = await Promise.all([
    viewer.user ? getFriendsToday(viewer.user.id, slug, dateKey) : null,
    viewer.user ? getDailySummary(slug, dateKey).catch(() => null) : null,
  ]);
  return (
    <PlayFrame slug={slug} title={meta.title} mode="daily">
      <Host
        {...common}
        mode="daily"
        seed={dateSeed(dateKey + edition)}
        log={progress?.log ?? ""}
        startedAt={progress?.startedAt ?? requestStartedAt}
        friendsToday={friends ? friends.scores.length : null}
        friendCount={friends?.friendCount ?? 0}
        friendScores={friends?.scores ?? []}
        shots={summary?.playerCount ?? null}
        practiceBest={null}
        shotToday={shotToday}
      />
    </PlayFrame>
  );
}
