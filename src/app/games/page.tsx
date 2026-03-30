import Link from "next/link";
import { getAllGames } from "@/lib/data/games";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Games",
  description:
    "Browse all Countrivo geography games. Daily challenges, quizzes, ranking games, and more.",
};

export default function GamesPage() {
  const games = getAllGames();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">All Games</h1>
      <p className="text-text-muted mb-8">
        {games.length} geography games to test your knowledge
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link
            key={game.slug}
            href={game.route}
            className="p-5 rounded-xl border border-border hover:border-brand/30 hover:bg-surface-muted transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{game.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold group-hover:text-brand transition-colors">
                    {game.title}
                  </h2>
                  {game.isFlagship && (
                    <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-full uppercase">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mt-0.5 line-clamp-2">
                  {game.shortDescription}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span>{game.estimatedTime}</span>
                  <span className="capitalize">{game.difficulty}</span>
                  <span className="capitalize">{game.category}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
