import Link from "next/link";

interface GameOverScreenProps {
  title: string;
  score: string;
  subtitle?: string;
  onPlayAgain?: () => void;
  children?: React.ReactNode;
}

const SUGGESTIONS = [
  { href: "/games/country-draft", emoji: "🎯", name: "Country Draft" },
  { href: "/games/higher-or-lower", emoji: "⬆️", name: "Higher or Lower" },
  { href: "/games/flag-quiz", emoji: "🏁", name: "Flag Quiz" },
  { href: "/games/capital-match", emoji: "🏛️", name: "Capital Match" },
];

export function GameOverScreen({
  title,
  score,
  subtitle,
  onPlayAgain,
  children,
}: GameOverScreenProps) {
  return (
    <div className="flex flex-col items-center gap-10 py-10 sm:py-14">
      <div className="text-center animate-in">
        <h2 className="text-3xl sm:text-4xl font-extrabold">{title}</h2>
        <div className="text-5xl sm:text-7xl font-extrabold font-mono mt-4 text-brand">{score}</div>
        {subtitle && <p className="text-lg text-text-muted mt-3">{subtitle}</p>}
      </div>

      {children}

      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-10 py-4 bg-brand text-white font-bold text-lg rounded-xl hover:bg-brand-dark transition-colors"
        >
          Play Again
        </button>
      )}

      {/* Discovery */}
      <div className="w-full border-t border-border pt-8 mt-2">
        <p className="text-base font-bold text-text-muted uppercase tracking-wide mb-4 text-center">
          Keep playing
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="game-card p-5 border border-border bg-surface text-center"
            >
              <span className="text-3xl block mb-2">{s.emoji}</span>
              <span className="text-base font-bold">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
