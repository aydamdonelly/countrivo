"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { ChallengeFriendPicker } from "@/components/friends/challenge-friend-picker";

interface ServerData {
  rankToday: number | null;
  percentile: number | null;
  totalPlayersToday: number;
  isPersonalBest: boolean;
  runId?: number;
  dailyDate?: string;
}

interface GameOverScreenProps {
  title: string;
  score: string;
  subtitle?: string;
  onPlayAgain?: () => void;
  onSaveScore?: () => void;
  children?: React.ReactNode;
  numericScore?: number;
  maxScore?: number;
  gameSlug?: string;
  serverData?: ServerData;
}

/* ---------- Tier system ---------- */

interface GradeTier {
  label: string;
  emoji: string;
  message: string;
  className: string;
  bgClassName: string;
}

function getGradeTier(pct: number): GradeTier {
  if (pct >= 100)
    return {
      label: "Perfect",
      emoji: "👑",
      message: "Flawless. Nothing left to optimize.",
      className: "grade-perfect",
      bgClassName: "bg-gold-dim border-gold/20",
    };
  if (pct >= 90)
    return {
      label: "Elite",
      emoji: "🔥",
      message: "Elite run. You know your geography.",
      className: "grade-elite",
      bgClassName: "bg-correct/5 border-correct/20",
    };
  if (pct >= 70)
    return {
      label: "Strong",
      emoji: "💪",
      message: "Strong. The top is within reach.",
      className: "grade-strong",
      bgClassName: "bg-blue-50 border-blue-200/50",
    };
  if (pct >= 50)
    return {
      label: "Close",
      emoji: "🎯",
      message: "Close. A few smarter picks and you crack elite.",
      className: "grade-close",
      bgClassName: "bg-amber-50 border-amber-200/50",
    };
  return {
    label: "Tough draw",
    emoji: "💀",
    message: "Brutal. Run it back.",
    className: "grade-tough",
    bgClassName: "bg-surface-elevated border-border",
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
  if (isNewBest) setStorageItem(`best_${gameSlug}`, score);
  const history = getScoreHistory(gameSlug);
  const updated = [...history, score].slice(-20);
  setStorageItem(`history_${gameSlug}`, updated);
  return { isNewBest, history: updated };
}

/* ---------- Simulated percentile ---------- */

function simulatePercentile(pct: number): number {
  if (pct >= 100) return 99;
  if (pct >= 90) return 85 + Math.floor(pct - 90);
  if (pct >= 70) return 55 + Math.floor((pct - 70) * 1.5);
  if (pct >= 50) return 25 + Math.floor((pct - 50) * 1.5);
  return 5 + Math.floor(pct * 0.4);
}

/* ---------- Analytical insight ---------- */

function getInsight(pct: number, history: number[], numericScore: number, maxScore: number): string {
  const missed = maxScore - numericScore;

  // Trend analysis
  if (history.length >= 3) {
    const recent3 = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length >= 2) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg * 1.1)
        return `You're improving! Last 3 averaged ${Math.round(recentAvg)}, up from ${Math.round(olderAvg)}.`;
      if (recentAvg < olderAvg * 0.9)
        return `Recent avg ${Math.round(recentAvg)} vs earlier ${Math.round(olderAvg)}. Time to lock in.`;
    }
  }

  if (pct >= 100) return "Perfect score. Absolutely flawless.";
  if (missed === 1) return "One away from perfect. So close.";
  if (missed <= 3) return `Just ${missed} from perfect. You're right there.`;
  if (pct >= 70) return `${numericScore}/${maxScore}. Strong run — top third territory.`;
  if (pct >= 50) return `${missed} points left on the table. You can close that gap.`;
  return `${numericScore}/${maxScore}. Study the patterns, then come back stronger.`;
}

/* ---------- Share ---------- */

async function shareResult(
  title: string, score: string, tier: string | null,
  percentile: number | null, rank: number | null, totalPlayers: number
) {
  const lines = [`${title}`, `${score}`];
  if (tier) lines.push(tier);
  if (rank && totalPlayers > 0) lines.push(`#${rank} of ${totalPlayers} players`);
  else if (rank) lines.push(`Rank #${rank} today`);
  if (percentile) lines.push(`Better than ${percentile}% of players`);
  lines.push("", "Can you beat me?", "countrivo.com");
  const text = lines.join("\n");
  if (navigator.share) {
    try { await navigator.share({ text }); } catch { /* cancelled */ }
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

/* ================================================================ */

export function GameOverScreen({
  title, score, subtitle, onPlayAgain, onSaveScore, children,
  numericScore, maxScore, gameSlug, serverData,
}: GameOverScreenProps) {
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [shared, setShared] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  const hasTier = numericScore !== undefined && maxScore !== undefined && maxScore > 0;
  const pct = hasTier ? (numericScore / maxScore) * 100 : null;
  const tier = pct !== null ? getGradeTier(pct) : null;
  const percentile = serverData?.percentile != null
    ? Math.round(serverData.percentile)
    : pct !== null ? simulatePercentile(pct) : null;
  const hasRealData = serverData?.percentile != null;
  const rankToday = serverData?.rankToday ?? null;
  const totalPlayers = serverData?.totalPlayersToday ?? 0;
  const insight = pct !== null && numericScore !== undefined && maxScore !== undefined
    ? getInsight(pct, history, numericScore, maxScore) : null;

  // Compute delta vs average
  const avg = history.length >= 2
    ? Math.round(history.reduce((a, b) => a + b, 0) / history.length)
    : null;
  const deltaVsAvg = avg !== null && numericScore !== undefined
    ? numericScore - avg : null;

  // "You beat X players" calculation
  const beatCount = percentile !== null && totalPlayers > 1
    ? Math.round((percentile / 100) * (totalPlayers - 1))
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

  const suggestions = useMemo(() =>
    ALL_SUGGESTIONS
      .filter((s) => !gameSlug || !s.href.includes(gameSlug))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4),
    [gameSlug]
  );

  const handleShare = useCallback(() => {
    shareResult(title, score, tier?.label ?? null, percentile, rankToday, totalPlayers);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [title, score, tier, percentile, rankToday, totalPlayers]);

  return (
    <div className="flex flex-col items-center gap-0 py-6 sm:py-10">

      {/* ═══════ LAYER 1: VERDICT ═══════ */}
      <div className={`w-full rounded-2xl border p-6 sm:p-10 text-center verdict-reveal ${tier?.bgClassName ?? "bg-surface-elevated border-border"}`}>
        {tier && (
          <div className="text-5xl sm:text-6xl mb-3">{tier.emoji}</div>
        )}

        <div className="text-5xl sm:text-7xl font-extrabold font-mono text-gold score-pop">
          {score}
        </div>

        {tier && (
          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
            <span className={`inline-block px-4 py-1.5 text-sm font-bold rounded-full ${tier.className}`}>
              {tier.label}
            </span>
          </div>
        )}
        {!tier && subtitle && (
          <p className="text-lg text-cream-muted text-center mt-2">{subtitle}</p>
        )}

        {/* Rank + percentile + beat count */}
        {(rankToday != null || percentile !== null || beatCount != null) && (
          <div className="flex items-center justify-center gap-4 sm:gap-5 mt-4 text-sm flex-wrap">
            {rankToday != null && (
              <span className="font-bold text-gold text-lg">
                #{rankToday}
                {totalPlayers > 0 && (
                  <span className="text-cream-muted font-normal text-sm"> / {totalPlayers}</span>
                )}
              </span>
            )}
            {beatCount != null && beatCount > 0 && (
              <span className="text-cream font-medium">
                You beat <span className="font-bold">{beatCount}</span> player{beatCount !== 1 ? "s" : ""}
              </span>
            )}
            {percentile !== null && (
              <span className="text-cream-muted">
                Better than <span className="font-bold text-cream">{percentile}%</span>
                {!hasRealData && <span className="text-[10px] ml-1 opacity-50">(est.)</span>}
              </span>
            )}
          </div>
        )}

        {/* Verdict message */}
        {tier && (
          <p className="text-sm text-cream-muted mt-3 max-w-xs mx-auto">{tier.message}</p>
        )}

        {/* Personal best banner */}
        {(serverData?.isPersonalBest || isNewBest) && (
          <div className="mt-4 inline-block px-5 py-2 bg-gold text-white text-sm font-bold rounded-full animate-scale-in">
            New personal best!
          </div>
        )}
      </div>

      {/* ═══════ LAYER 2: IDENTITY / STATS ═══════ */}
      <div className="w-full mt-5">
        <div className="flex items-stretch justify-center gap-3 flex-wrap">
          {gameSlug && personalBest !== null && !isNewBest && (
            <StatPill label="Your best" value={String(personalBest)} />
          )}
          {history.length > 1 && (
            <StatPill label="Attempts" value={String(history.length)} />
          )}
          {avg !== null && (
            <StatPill label="Avg score" value={String(avg)} />
          )}
          {deltaVsAvg !== null && deltaVsAvg !== 0 && (
            <StatPill
              label="vs avg"
              value={`${deltaVsAvg > 0 ? "+" : ""}${deltaVsAvg}`}
              highlight={deltaVsAvg > 0 ? "good" : "bad"}
            />
          )}
        </div>

        {/* Analytical insight */}
        {insight && (
          <p className="text-xs text-cream-muted text-center max-w-sm mx-auto mt-4 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border">
            {insight}
          </p>
        )}
      </div>

      {/* ═══════ LAYER 2.5: GAME-SPECIFIC ANALYSIS ═══════ */}
      {children && <div className="w-full mt-5">{children}</div>}

      {/* ═══════ LAYER 3: ACTIONS ═══════ */}
      <div className="w-full mt-6 grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 max-w-md mx-auto">
        {onSaveScore && (
          <button onClick={onSaveScore} className="cta-primary sm:flex-1">
            Save my score
          </button>
        )}
        {onPlayAgain && (
          <button onClick={onPlayAgain} className="cta-primary sm:flex-1">
            Play again
          </button>
        )}
        <button onClick={handleShare} className="cta-secondary sm:flex-1">
          {shared ? "Copied!" : "Share result"}
        </button>
        {serverData?.runId && gameSlug && (
          <button
            onClick={() => setShowChallengePicker(true)}
            className="cta-secondary sm:flex-1"
          >
            Challenge a friend
          </button>
        )}
      </div>
      {showChallengePicker && serverData?.runId && gameSlug && (
        <ChallengeFriendPicker
          gameSlug={gameSlug}
          dailyDate={serverData.dailyDate ?? new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" })}
          runId={serverData.runId}
          onClose={() => setShowChallengePicker(false)}
        />
      )}
      {gameSlug && (
        <Link
          href={`/games/${gameSlug}/leaderboard`}
          className="cta-secondary mt-3 text-sm w-full max-w-md"
        >
          View today&apos;s leaderboard
        </Link>
      )}

      {/* ═══════ LAYER 4: DISCOVERY ═══════ */}
      <div className="w-full border-t border-border pt-6 mt-6">
        <p className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3 text-center">
          Try another game
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {suggestions.map((s) => {
            const slug = s.href.replace("/games/", "");
            const colors = GAME_COLORS[slug] ?? { bg: "#f3f4f6", text: "#374151" };
            return (
              <Link
                key={s.href}
                href={s.href}
                className="game-card p-4 text-center"
                style={{ backgroundColor: colors.bg }}
              >
                <s.icon className="w-7 h-7 mx-auto mb-1.5" style={{ color: colors.text }} />
                <span className="text-sm font-bold" style={{ color: colors.text }}>
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

/* ---------- Stat pill ---------- */

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: "good" | "bad" }) {
  return (
    <div className={`px-4 py-2.5 rounded-xl text-center min-w-20 ${
      highlight === "good"
        ? "bg-correct/8 border border-correct/20"
        : highlight === "bad"
          ? "bg-incorrect/8 border border-incorrect/20"
          : "bg-surface-elevated"
    }`}>
      <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-lg font-extrabold font-mono mt-0.5 ${
        highlight === "good" ? "text-correct" : highlight === "bad" ? "text-incorrect" : ""
      }`}>
        {value}
      </div>
    </div>
  );
}
