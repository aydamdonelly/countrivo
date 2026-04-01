"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  IconTarget,
  IconChevronDouble,
  IconFlag,
  IconPin,
  IconBars,
  IconBolt,
  IconChain,
  IconGlobe,
  IconHash,
  IconClock,
  IconSearch,
} from "@/components/icons";
import { GAME_COLORS } from "@/lib/game-colors";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface GameOverScreenProps {
  title: string;
  score: string;
  subtitle?: string;
  onPlayAgain?: () => void;
  children?: React.ReactNode;
  /** Numeric score for tier + comparison calculation */
  numericScore?: number;
  /** Max possible score for tier calculation */
  maxScore?: number;
  /** Game slug for personal best + history tracking */
  gameSlug?: string;
}

/* ---------- Tier system ---------- */

interface GradeTier {
  label: string;
  message: string;
  className: string;
}

function getGradeTier(pct: number): GradeTier {
  if (pct >= 100)
    return {
      label: "Perfect",
      message: "Flawless. Nothing left to optimize.",
      className: "grade-perfect",
    };
  if (pct >= 90)
    return {
      label: "Elite",
      message: "Elite run. Top-tier knowledge.",
      className: "grade-elite",
    };
  if (pct >= 70)
    return {
      label: "Strong",
      message: "Strong run. Room at the top.",
      className: "grade-strong",
    };
  if (pct >= 50)
    return {
      label: "Close",
      message: "Close. A few better picks and you're elite.",
      className: "grade-close",
    };
  return {
    label: "Tough draw",
    message: "Brutal draw. Run it back.",
    className: "grade-tough",
  };
}

/* ---------- Personal best + history ---------- */

function getPersonalBest(gameSlug: string): number | null {
  return getStorageItem<number | null>(`best_${gameSlug}`, null);
}

function getScoreHistory(gameSlug: string): number[] {
  return getStorageItem<number[]>(`history_${gameSlug}`, []);
}

function saveScore(gameSlug: string, score: number): { isNewBest: boolean; history: number[] } {
  const best = getPersonalBest(gameSlug);
  const isNewBest = best === null || score > best;
  if (isNewBest) {
    setStorageItem(`best_${gameSlug}`, score);
  }

  const history = getScoreHistory(gameSlug);
  const updated = [...history, score].slice(-20); // keep last 20
  setStorageItem(`history_${gameSlug}`, updated);

  return { isNewBest, history: updated };
}

/* ---------- Simulated percentile ---------- */

function simulatePercentile(pct: number): number {
  // Produce a believable percentile based on score percentage
  // Higher scores = higher percentile, with realistic distribution
  if (pct >= 100) return 99;
  if (pct >= 90) return 85 + Math.floor(pct - 90);
  if (pct >= 70) return 55 + Math.floor((pct - 70) * 1.5);
  if (pct >= 50) return 25 + Math.floor((pct - 50) * 1.5);
  return 5 + Math.floor(pct * 0.4);
}

/* ---------- Analytical insight ---------- */

function getInsight(
  pct: number,
  history: number[],
  numericScore: number,
  maxScore: number
): string {
  const missed = maxScore - numericScore;

  // Trend analysis if we have history
  if (history.length >= 3) {
    const recent3 = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length >= 2) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg * 1.1) {
        return `Trending up. Your last 3 average (${Math.round(recentAvg)}) beats your earlier average (${Math.round(olderAvg)}).`;
      }
      if (recentAvg < olderAvg * 0.9) {
        return `Dipping. Recent average ${Math.round(recentAvg)} vs earlier ${Math.round(olderAvg)}. Time to focus.`;
      }
    }
  }

  // Score-based insight
  if (pct >= 100) return `Perfect score. ${maxScore} out of ${maxScore}.`;
  if (missed === 1) return `One away from perfect. So close.`;
  if (missed <= 3) return `${missed} points from perfect. Elite territory.`;
  if (pct >= 70) return `${numericScore} out of ${maxScore}. Solid — top third range.`;
  if (pct >= 50) return `${missed} points left on the table. Replay to close the gap.`;
  return `${numericScore} out of ${maxScore}. Study the categories, then run it back.`;
}

/* ---------- Share ---------- */

async function shareResult(title: string, score: string, tier: string | null, percentile: number | null) {
  const lines = [title, score];
  if (tier) lines.push(tier);
  if (percentile) lines.push(`Top ${100 - percentile}%`);
  lines.push("", "countrivo.com");
  const text = lines.join("\n");
  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch {
      /* cancelled */
    }
  } else {
    await navigator.clipboard.writeText(text);
  }
}

/* ---------- Suggestions ---------- */

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
  numericScore,
  maxScore,
  gameSlug,
}: GameOverScreenProps) {
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [shared, setShared] = useState(false);

  const hasTier =
    numericScore !== undefined && maxScore !== undefined && maxScore > 0;
  const pct = hasTier ? (numericScore / maxScore) * 100 : null;
  const tier = pct !== null ? getGradeTier(pct) : null;
  const percentile = pct !== null ? simulatePercentile(pct) : null;
  const insight =
    pct !== null && numericScore !== undefined && maxScore !== undefined
      ? getInsight(pct, history, numericScore, maxScore)
      : null;

  useEffect(() => {
    if (gameSlug && numericScore !== undefined) {
      const prevBest = getPersonalBest(gameSlug);
      setPersonalBest(prevBest);
      const result = saveScore(gameSlug, numericScore);
      setIsNewBest(result.isNewBest);
      setHistory(result.history);
    }
  }, [gameSlug, numericScore]);

  const suggestions = ALL_SUGGESTIONS.filter(
    (s) => !gameSlug || !s.href.includes(gameSlug)
  )
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const handleShare = useCallback(() => {
    shareResult(title, score, tier?.label ?? null, percentile);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [title, score, tier, percentile]);

  return (
    <div className="flex flex-col items-center gap-5 py-8 sm:py-12 stagger-result">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center">
        {title}
      </h2>

      {/* Score — big, gold, monospace */}
      <div className="text-5xl sm:text-7xl font-extrabold font-mono text-gold animate-count-up">
        {score}
      </div>

      {/* Tier badge + percentile */}
      {tier && percentile !== null ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`inline-block px-4 py-1.5 text-sm font-bold rounded-full ${tier.className}`}
            >
              {tier.label}
            </span>
            <span className="text-sm text-cream-muted">
              Top <span className="font-bold text-cream">{100 - percentile}%</span>
            </span>
          </div>
          <p className="text-sm text-cream-muted text-center max-w-xs">
            {tier.message}
          </p>
        </div>
      ) : subtitle ? (
        <p className="text-lg text-cream-muted text-center">{subtitle}</p>
      ) : null}

      {/* Analytical insight — the "what happened" layer */}
      {insight && (
        <p className="text-xs text-cream-muted text-center max-w-sm px-4 py-2 rounded-lg bg-surface-elevated border border-border">
          📊 {insight}
        </p>
      )}

      {/* Comparison row: personal best + score stats */}
      {gameSlug && (
        <div className="flex items-center gap-4 text-center">
          {/* Personal best */}
          <div className="px-4 py-2 rounded-lg bg-surface-elevated">
            {isNewBest ? (
              <>
                <div className="text-[10px] text-gold font-bold uppercase tracking-wide">
                  New best!
                </div>
                <div className="text-lg font-extrabold font-mono text-gold animate-scale-in">
                  {numericScore}
                </div>
              </>
            ) : personalBest !== null ? (
              <>
                <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
                  Your best
                </div>
                <div className="text-lg font-extrabold font-mono">
                  {personalBest}
                </div>
              </>
            ) : null}
          </div>

          {/* Games played */}
          {history.length > 1 && (
            <div className="px-4 py-2 rounded-lg bg-surface-elevated">
              <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
                Attempts
              </div>
              <div className="text-lg font-extrabold font-mono">
                {history.length}
              </div>
            </div>
          )}

          {/* Average */}
          {history.length >= 2 && (
            <div className="px-4 py-2 rounded-lg bg-surface-elevated">
              <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
                Avg score
              </div>
              <div className="text-lg font-extrabold font-mono">
                {Math.round(history.reduce((a, b) => a + b, 0) / history.length)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game-specific children */}
      {children}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="cta-primary w-full sm:w-auto"
          >
            Play again
          </button>
        )}
        <button
          onClick={handleShare}
          className="cta-secondary w-full sm:w-auto"
        >
          {shared ? "Copied!" : "Share result"}
        </button>
      </div>

      {/* Next challenge — discovery */}
      <div className="w-full border-t border-border pt-6 mt-2">
        <p className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3 text-center">
          Try another game
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {suggestions.map((s) => {
            const slug = s.href.replace("/games/", "");
            const colors = GAME_COLORS[slug] ?? {
              bg: "#f3f4f6",
              text: "#374151",
            };
            return (
              <Link
                key={s.href}
                href={s.href}
                className="game-card p-4 text-center"
                style={{ backgroundColor: colors.bg }}
              >
                <s.icon
                  className="w-7 h-7 mx-auto mb-1.5"
                  style={{ color: colors.text }}
                />
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  {s.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
