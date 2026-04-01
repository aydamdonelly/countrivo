import Link from "next/link";
import { IconTarget, IconChevronDouble, IconFlag, IconPin, IconBars, IconBolt, IconChain, IconGlobe, IconHash, IconClock, IconSearch } from "@/components/icons";

interface GameOverScreenProps {
  title: string;
  score: string;
  subtitle?: string;
  onPlayAgain?: () => void;
  children?: React.ReactNode;
}

const ALL_SUGGESTIONS = [
  { href: "/games/country-draft", icon: IconTarget, name: "Country Draft" },
  { href: "/games/higher-or-lower", icon: IconChevronDouble, name: "Higher or Lower" },
  { href: "/games/flag-quiz", icon: IconFlag, name: "Flag Quiz" },
  { href: "/games/capital-match", icon: IconPin, name: "Capital Match" },
  { href: "/games/population-sort", icon: IconBars, name: "Population Sort" },
  { href: "/games/country-streak", icon: IconBolt, name: "Country Streak" },
  { href: "/games/border-buddies", icon: IconChain, name: "Border Buddies" },
  { href: "/games/continent-sprint", icon: IconGlobe, name: "Continent Sprint" },
  { href: "/games/stat-guesser", icon: IconHash, name: "Stat Guesser" },
  { href: "/games/speed-flags", icon: IconClock, name: "Speed Flags" },
  { href: "/games/odd-one-out", icon: IconSearch, name: "Odd One Out" },
];

export function GameOverScreen({
  title,
  score,
  subtitle,
  onPlayAgain,
  children,
}: GameOverScreenProps) {
  // Pick 4 random suggestions
  const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5);
  const suggestions = shuffled.slice(0, 4);

  return (
    <div className="flex flex-col items-center gap-10 py-10 sm:py-14">
      <div className="text-center animate-in">
        <h2 className="text-3xl sm:text-4xl font-extrabold">{title}</h2>
        <div className="text-5xl sm:text-7xl font-extrabold font-mono mt-4 text-gold">{score}</div>
        {subtitle && <p className="text-lg text-cream-muted mt-3">{subtitle}</p>}
      </div>

      {children}

      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-10 py-4 bg-gold text-white font-bold text-lg rounded-xl hover:opacity-90 transition-colors"
        >
          Play Again
        </button>
      )}

      {/* Discovery */}
      <div className="w-full border-t border-border pt-8 mt-2">
        <p className="text-base font-bold text-cream-muted uppercase tracking-wide mb-4 text-center">
          Keep playing
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="game-card p-5 border border-black/5 bg-white shadow-sm text-center"
            >
              <s.icon className="w-8 h-8 mx-auto mb-2 text-gold" />
              <span className="text-base font-bold">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
