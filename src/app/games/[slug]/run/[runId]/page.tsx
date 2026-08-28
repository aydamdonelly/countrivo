import type { Metadata } from "next";
import Link from "next/link";
import { GameMark } from "@/components/home/game-mark";
import { notFound } from "next/navigation";
import { getRunDetail } from "@/app/actions/game-runs";
import { getGameBySlug } from "@/lib/data/games";
import { getGameColor } from "@/lib/game-colors";
import { RunDetailBody } from "@/components/game/run-detail/run-detail-body";

interface Props {
  params: Promise<{ slug: string; runId: string }>;
}

function formatDailyDate(dailyDate: string): string {
  return new Date(dailyDate + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, runId } = await params;
  const run = await getRunDetail(Number(runId));
  if (!run || run.gameSlug !== slug) {
    return { title: "Run not found", robots: { index: false } };
  }
  const game = getGameBySlug(slug);
  const gameTitle = game?.title ?? slug;
  const date = formatDailyDate(run.dailyDate);
  return {
    title: `${run.displayName}'s ${gameTitle} · ${date}`,
    description: `${run.displayName} scored ${run.scoreDisplay} on the ${gameTitle} daily challenge for ${date}.`,
    robots: { index: false },
  };
}

export default async function RunDetailPage({ params }: Props) {
  const { slug, runId } = await params;
  const run = await getRunDetail(Number(runId));
  if (!run || run.gameSlug !== slug) notFound();

  const game = getGameBySlug(slug);
  const colors = getGameColor(slug);
  const date = formatDailyDate(run.dailyDate);

  const topPercent =
    run.percentile !== null ? Math.max(1, Math.round(100 - run.percentile)) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/games/${slug}/leaderboard`}
          className="text-sm text-cream-muted hover:text-cream transition-colors"
        >
          ← Back to leaderboard
        </Link>
      </div>

      {/* Header */}
      <header
        className="rounded-2xl p-5 sm:p-6 mb-6"
        style={{ backgroundColor: colors.bg }}
      >
        <div className="flex items-center gap-3">
          {run.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={run.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 bg-black/10"
              style={{ color: colors.text }}
            >
              {(run.displayName || run.username)[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/profile/${run.username}`}
              className="text-lg font-extrabold truncate hover:underline"
              style={{ color: colors.text }}
            >
              {run.displayName || run.username}
            </Link>
            <p className="text-sm opacity-70" style={{ color: colors.text }}>
              {game ? <><GameMark slug={game.slug} size={14} className="mr-1 align-[-2px]" />{game.title}</> : slug} · {date}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p
            className="font-display font-semibold text-5xl sm:text-6xl tabular-nums"
            style={{ color: colors.text }}
          >
            {(run.scoreDisplay ?? "").match(/^Score:\s*([^\s(]+)/i)?.[1] ?? run.scoreDisplay}
          </p>
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm"
            style={{ color: colors.text }}
          >
            {run.rankDaily !== null && (
              <span className="font-bold">Rank #{run.rankDaily}</span>
            )}
            {topPercent !== null && (
              <span className="opacity-80">Top {topPercent}% of players</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <Link href={`/games/${slug}`} className="cta-primary text-sm">
            Play this game
          </Link>
        </div>
      </header>

      {/* Decisions */}
      <RunDetailBody run={run} colors={colors} />
    </div>
  );
}
