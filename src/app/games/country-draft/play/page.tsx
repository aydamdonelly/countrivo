import Link from "next/link";
import { GameMark } from "@/components/home/game-mark";
import { DraftBoard } from "@/components/games/country-draft/draft-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";
import { getDailyEdition } from "@/lib/daily-edition";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Country Draft · Play",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function DraftPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";
  const edition = await getDailyEdition();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link
          href="/games/country-draft"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cream-muted hover:text-cream transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          Back
        </Link>
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="text-cream shrink-0"><GameMark slug="country-draft" size={22} /></span>
          <span className="font-display font-semibold text-base">Country Draft</span>
        </span>
        <span className={`text-xs font-medium whitespace-nowrap ${gameMode === "daily" ? "text-cream" : "text-cream-muted"}`}>
          {gameMode === "daily" ? "Daily · one shot" : "Practice · doesn't count"}
        </span>
      </div>
      {gameMode === "daily" ? (
          <DailyLockoutGuard gameSlug="country-draft" gameEmoji="🎯" gameTitle="Country Draft" edition={edition}>
            <DraftBoard mode={gameMode} edition={edition} />
          </DailyLockoutGuard>
        ) : (
          <DraftBoard mode={gameMode} edition={edition} />
        )}
    </div>
  );
}
