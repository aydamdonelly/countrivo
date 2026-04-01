import Link from "next/link";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { getGameColor } from "@/lib/game-colors";

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
  difficulty?: string;
  estimatedTime?: string;
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
  difficulty,
  estimatedTime,
}: GameLandingProps) {
  const slug = playHref.replace("/play", "").replace("/games/", "");
  const colors = getGameColor(slug);

  const related = (relatedGames ?? DEFAULT_RELATED).filter(
    (g) => g.href !== playHref.replace("/play", "")
  );

  // Show max 3 rules
  const displayRules = rules.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto">
      <GameJsonLd
        name={`${title} | Countrivo`}
        title={title}
        description={description}
        url={playHref.replace("/play", "")}
        genre={`Geography ${category}`}
        playMode="SinglePlayer"
        rules={rules}
      />

      {/* Compact hero */}
      <div
        className="px-4 py-10 sm:py-12 text-center -mx-4 sm:-mx-6 lg:-mx-8 rounded-b-2xl"
        style={{ backgroundColor: colors.bg }}
      >
        <span className="text-6xl mb-3 block">{emoji}</span>
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: colors.text }}
        >
          {title}
        </h1>
        <p className="text-cream-muted text-base mt-2 max-w-md mx-auto">
          {description}
        </p>

        {/* Meta chips */}
        {(difficulty || estimatedTime || category) && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {difficulty && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 capitalize"
                style={{ color: colors.text }}
              >
                {difficulty}
              </span>
            )}
            {estimatedTime && (
              <span
                className="text-xs opacity-60"
                style={{ color: colors.text }}
              >
                {estimatedTime}
              </span>
            )}
            {category && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 capitalize"
                style={{ color: colors.text }}
              >
                {category}
              </span>
            )}
          </div>
        )}

        {/* Side-by-side CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 px-4">
          {hasDailyMode && (
            <Link
              href={`${playHref}?mode=daily`}
              className="cta-primary w-full sm:w-auto"
            >
              Play today&apos;s challenge
            </Link>
          )}
          <Link
            href={`${playHref}?mode=practice`}
            className="cta-secondary w-full sm:w-auto"
          >
            Practice unlimited
          </Link>
        </div>

        {/* Mode descriptions — compact, below CTAs */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-cream-muted">
          {hasDailyMode && (
            <span>One puzzle. One shot. Same draw for everyone.</span>
          )}
          <span>New countries every run.</span>
        </div>

        {hasDailyMode && (
          <div className="mt-3">
            <Link
              href={`/games/${slug}/leaderboard`}
              className="text-sm font-medium text-cream-muted hover:text-cream transition-colors underline underline-offset-4"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              View today&apos;s leaderboard →
            </Link>
          </div>
        )}
      </div>

      {/* How it works — compact */}
      {displayRules.length > 0 && (
        <div className="mt-8 px-4 sm:px-0 p-6 bg-surface-elevated rounded-xl max-w-md mx-auto">
          <h3 className="font-bold text-base mb-3">How it works</h3>
          <ol className="space-y-2 text-sm text-cream-muted">
            {displayRules.map((rule, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gold-dim text-gold font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Related games */}
      <div className="mt-10 px-4 pb-8">
        <h3 className="font-bold text-sm text-cream-muted uppercase tracking-wide mb-3 text-center">
          Try next
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
          {related.slice(0, 6).map((g) => {
            const gSlug = g.href.replace("/games/", "");
            const gColors = getGameColor(gSlug);
            return (
              <Link
                key={g.href}
                href={g.href}
                className="game-card p-4 text-center"
                style={{ backgroundColor: gColors.bg }}
              >
                <span className="text-2xl block mb-1">{g.emoji}</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: gColors.text }}
                >
                  {g.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
