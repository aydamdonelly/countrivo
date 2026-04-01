import Link from "next/link";
import { GameJsonLd } from "@/components/seo/game-jsonld";

interface RelatedGame {
  href: string;
  emoji: string;
  name: string;
}

interface GameLandingProps {
  emoji: string;
  title: string;
  description: string;
  playHref: string;
  rules: string[];
  hasDailyMode?: boolean;
  relatedGames?: RelatedGame[];
  category?: string;
}

const DEFAULT_RELATED: RelatedGame[] = [
  { href: "/games/country-draft", emoji: "🎯", name: "Country Draft" },
  { href: "/games/higher-or-lower", emoji: "⬆️", name: "Higher or Lower" },
  { href: "/games/flag-quiz", emoji: "🏁", name: "Flag Quiz" },
  { href: "/games/capital-match", emoji: "🏛️", name: "Capital Match" },
  { href: "/games/population-sort", emoji: "📊", name: "Population Sort" },
  { href: "/games/country-streak", emoji: "🔥", name: "Country Streak" },
];

export function GameLanding({
  emoji,
  title,
  description,
  playHref,
  rules,
  hasDailyMode = true,
  relatedGames,
  category = "quiz",
}: GameLandingProps) {
  const related = (relatedGames ?? DEFAULT_RELATED).filter(
    (g) => g.href !== playHref.replace("/play", "")
  );

  return (
    <div className="max-w-5xl mx-auto">
      <GameJsonLd
        name={`${title} | Countrivo`}
        title={title}
        description={description}
        url={playHref.replace("/play", "")}
        genre={`Geography ${category}`}
        playMode="SinglePlayer"
        rules={rules}
      />
      {/* Hero */}
      <div className="bg-surface border-b border-border px-4 py-12 sm:py-16 text-center -mx-4 sm:-mx-6 lg:-mx-8">
        <span className="text-7xl mb-4 block">{emoji}</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold">{title}</h1>
        <p className="text-cream-muted text-lg mt-3 max-w-xl mx-auto">{description}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 px-4 mt-10 max-w-xl mx-auto">
        {hasDailyMode && (
          <Link
            href={`${playHref}?mode=daily`}
            className="block py-5 px-8 rounded-xl border-2 border-border bg-gold-dim hover:border-gold hover:bg-gold-dim transition-all text-center"
          >
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-xl font-bold">Daily Challenge</h2>
            <p className="text-base text-cream-muted mt-1">
              Same puzzle for everyone. One attempt per day.
            </p>
          </Link>
        )}

        <Link
          href={`${playHref}?mode=practice`}
          className="block py-5 px-8 rounded-xl border-2 border-border hover:border-border hover:bg-surface transition-all text-center"
        >
          <div className="text-3xl mb-2">🔄</div>
          <h2 className="text-xl font-bold">Practice</h2>
          <p className="text-base text-cream-muted mt-1">
            Random content. Unlimited plays.
          </p>
        </Link>
      </div>

      {/* How to Play */}
      <div className="mt-12 px-4 sm:px-0 p-8 bg-surface rounded-xl max-w-xl mx-auto">
        <h3 className="font-bold text-xl mb-4">How to Play</h3>
        <ol className="space-y-3 text-base text-cream-muted">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-gold-dim text-gold font-bold text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
      </div>

      {/* Related games */}
      <div className="mt-12 px-4 pb-8">
        <h3 className="font-bold text-lg text-cream-muted uppercase tracking-wide mb-4 text-center">
          More Games
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
          {related.slice(0, 6).map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="game-card p-5 border border-border bg-surface text-center"
            >
              <span className="text-3xl block mb-2">{g.emoji}</span>
              <span className="text-base font-bold">{g.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
