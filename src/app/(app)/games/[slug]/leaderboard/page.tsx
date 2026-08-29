import type { Metadata } from "next";
import { getGameBySlug } from "@/lib/data/registry";
import { LeaderboardPage } from "@/features/social/leaderboard-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  return {
    title: game ? `${game.title}: Today's Board` : "Today's board",
    description: game
      ? `Today's ${game.title} shots, ranked. One shot per player, same board for everyone, resets at midnight Berlin time.`
      : "Today's board.",
    robots: { index: false, follow: true },
  };
}

export default async function Leaderboard({ params, searchParams }: Props) {
  const [{ slug }, { date, tab }] = await Promise.all([params, searchParams]);
  return <LeaderboardPage slug={slug} date={date} tab={tab} />;
}
