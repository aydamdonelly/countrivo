import Link from "next/link";
import { DraftBoard } from "@/components/games/country-draft/draft-board";
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function DraftPlayPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const gameMode = mode === "daily" ? "daily" : "practice";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/games/country-draft"
          className="text-base font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className={`text-base font-bold uppercase tracking-wider ${
            gameMode === "daily" ? "text-gold" : "text-cream-muted"
          }`}>
            {gameMode === "daily" ? "Daily Challenge" : "Practice"}
          </span>
        </div>
      </div>
      {gameMode === "daily" ? (
          <DailyLockoutGuard gameSlug="country-draft" gameEmoji="🎯" gameTitle="Country Draft">
            <DraftBoard mode={gameMode} />
          </DailyLockoutGuard>
        ) : (
          <DraftBoard mode={gameMode} />
        )}
    </div>
  );
}
