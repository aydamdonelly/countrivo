import type { Metadata } from "next";
import { getRunDetail } from "@/app/actions/game-runs";
import { getGameBySlug } from "@/lib/data/registry";
import { compactScore } from "@/server/boards";
import { RunPage } from "@/features/social/run-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; runId: string }>;
}

/** `Saturday, August 28, 2026` for the description (blueprint 10.1: daily board, not challenge). */
function longDate(dailyDate: string): string {
  return new Date(`${dailyDate}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, runId } = await params;
  const id = Number(runId);
  const run = Number.isFinite(id) ? await getRunDetail(id) : null;
  if (!run || run.gameSlug !== slug) return { title: "Run not found", robots: { index: false } };
  const gameTitle = getGameBySlug(slug)?.title ?? slug;
  const date = longDate(run.dailyDate);
  return {
    title: `${run.displayName}'s ${gameTitle} · ${date}`,
    /* The compact score, not the stored display: "scored Score: 250 (Gap: 94)" is the
       database talking, and this line is what a shared link shows. */
    description: `${run.displayName} scored ${compactScore(run.scoreDisplay, run.scoreRaw)} on the ${gameTitle} daily board for ${date}.`,
    robots: { index: false },
  };
}

export default async function Run({ params }: Props) {
  const { slug, runId } = await params;
  return <RunPage slug={slug} runId={runId} />;
}
