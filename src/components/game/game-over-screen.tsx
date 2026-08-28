"use client";
import { GameMark } from "@/components/home/game-mark";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
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
  IconArrowRight,
} from "@/components/icons";
import { GAME_COLORS } from "@/lib/game-colors";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { fireConfetti } from "@/lib/confetti";
import { getAllGames } from "@/lib/data/registry";
import { getTodayDateKey } from "@/lib/daily-seed";
import { useResetCountdown } from "@/hooks/use-reset-countdown";
import { buildShareGrid } from "@/components/share/share-utils";
import { LeaderboardJoin } from "@/components/game/leaderboard-join";
import { requestPushPermission } from "@/lib/native/bootstrap";
import { Button } from "@/components/ui/button";

// Heavy, interaction-only subtrees: code-split out of the initial game bundle.
// Both are client-only and gated behind button clicks, so ssr:false is safe.
const ShareLoading = () => (
  <div className="py-8 text-center text-sm text-cream-muted">Loading…</div>
);

const ChallengeFriendPicker = dynamic(
  () => import("@/components/friends/challenge-friend-picker").then((m) => m.ChallengeFriendPicker),
  { ssr: false },
);

const ShareCard = dynamic(
  () => import("@/components/share/share-card").then((m) => m.ShareCard),
  { ssr: false, loading: ShareLoading },
);

interface ServerData {
  rankToday: number | null;
  percentile: number | null;
  totalPlayersToday: number;
  isPersonalBest: boolean;
  runId?: number;
  dailyDate?: string;
}

type ShareGame = "country-draft" | "stat-guesser" | "geo-wordle";

interface ShareData {
  game: ShareGame;
  result: Record<string, unknown>;
  dateKey: string;
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
  /** Phase 4 share-grids: when present, "Share result" opens the per-game emoji card. */
  shareData?: ShareData;
}

/* ---------- Tier system ---------- */

interface GradeTier {
  label: string;
  message: string;
  className: string;
  bgClassName: string;
}

function getGradeTier(pct: number): GradeTier {
  if (pct >= 100)
    return {
      label: "Perfect",
      message: "Every answer correct.",
      className: "grade-perfect",
      bgClassName: "bg-gold-dim border-gold/20",
    };
  if (pct >= 90)
    return {
      label: "Elite",
      message: "Near-perfect. Few can touch this.",
      className: "grade-elite",
      bgClassName: "bg-correct/5 border-correct/20",
    };
  if (pct >= 70)
    return {
      label: "Solid",
      message: "You know your stuff.",
      className: "grade-strong",
      bgClassName: "bg-accent/5 border-accent/20",
    };
  if (pct >= 50)
    return {
      label: "Decent",
      message: "Room to improve.",
      className: "grade-close",
      bgClassName: "bg-warning/5 border-warning/20",
    };
  return {
    label: "Rough",
    message: "Better luck next round.",
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
  // A first run is a baseline, not a record; only a beaten, non-zero best counts.
  const isNewBest = best !== null && score > best && score > 0;
  if (best === null || score > best) setStorageItem(`best_${gameSlug}`, score);
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

  if (history.length >= 3) {
    const recent3 = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length >= 2) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg * 1.1)
        return `Trending up. Last 3 avg: ${Math.round(recentAvg)} (was ${Math.round(olderAvg)}).`;
      if (recentAvg < olderAvg * 0.9)
        return `Recent avg ${Math.round(recentAvg)}, down from ${Math.round(olderAvg)}.`;
    }
  }

  if (pct >= 100) return "Nothing to improve.";
  if (missed === 1) return "One away from perfect.";
  if (missed <= 3) return `${missed} from perfect.`;
  if (pct >= 50) return `${missed} points left on the table.`;
  return "";
}

/* ---------- Share ---------- */

async function shareText(text: string) {
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

/* ---------- Daily chaining ----------
 * Mirrors daily-hero's next-unplayed-daily logic. Client-safe: reads only the
 * lightweight game registry + localStorage completion flags. Returns the next
 * daily the player hasn't cleared today, plus how many remain and the total.
 */

interface DailyChainInfo {
  total: number;
  completed: number;
  remaining: number;
  next: { title: string; emoji: string; route: string } | null;
}

function getDailyChainInfo(currentSlug: string | undefined): DailyChainInfo {
  if (typeof window === "undefined") {
    return { total: 0, completed: 0, remaining: 0, next: null };
  }
  const dailyGames = getAllGames().filter((g) => g.availableModes.includes("daily"));
  const dateKey = getTodayDateKey();
  let completed = 0;
  let next: DailyChainInfo["next"] = null;
  for (const g of dailyGames) {
    const played = getStorageItem<boolean>(`daily_${g.slug}_${dateKey}_completed`, false);
    if (played) {
      completed++;
    } else if (!next && g.slug !== currentSlug) {
      // The current game's flag may not be flushed yet at render time; skip it
      // so we always point at a genuinely different next daily.
      next = { title: g.title, emoji: g.emoji, route: g.route };
    }
  }
  return {
    total: dailyGames.length,
    completed,
    remaining: Math.max(0, dailyGames.length - completed),
    next,
  };
}

/* ================================================================ */

export function GameOverScreen({
  title, score, subtitle, onPlayAgain, onSaveScore, children,
  numericScore, maxScore, gameSlug, serverData, shareData,
}: GameOverScreenProps) {
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [shared, setShared] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  // A daily finish is one where the board didn't hand us an instant-replay
  // callback (practice mode does) but we still know which game this is.
  const isDailyFinish = !onPlayAgain && gameSlug !== undefined;

  // Native iOS: ask for push permission AFTER the first completed daily (value
  // felt first), never on cold launch. Once per device. No-op on the website.
  useEffect(() => {
    if (!isDailyFinish) return;
    if (getStorageItem<boolean>("push_prompt_seen", false)) return;
    setStorageItem("push_prompt_seen", true);
    void requestPushPermission();
  }, [isDailyFinish]);

  // One confetti burst for a great score (≥90%) or a personal best. Fires once;
  // reduced-motion is honored inside fireConfetti.
  const confettiFired = useRef(false);
  useEffect(() => {
    if (confettiFired.current) return;
    const great = (hasTier && pct !== null && pct >= 90) || serverData?.isPersonalBest === true;
    if (great) {
      confettiFired.current = true;
      fireConfetti();
    }
  }, [hasTier, pct, serverData?.isPersonalBest]);

  // Live ticking countdown to the next Berlin-midnight reset (real scarcity).
  const resetCountdown = useResetCountdown();

  // Next-unplayed daily chain, hydrated client-side on mount.
  const [chain, setChain] = useState<DailyChainInfo>({
    total: 0, completed: 0, remaining: 0, next: null,
  });
  useEffect(() => {
    if (!isDailyFinish) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setChain(getDailyChainInfo(gameSlug));
  }, [isDailyFinish, gameSlug]);

  useEffect(() => {
    if (gameSlug && numericScore !== undefined) {
      const prevBest = getPersonalBest(gameSlug);
      // Hydrating personal-best history from localStorage on mount / score change.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external-system hydration
      setPersonalBest(prevBest);
      const result = saveScore(gameSlug, numericScore);
      setIsNewBest(result.isNewBest);
      setHistory(result.history);
    }
  }, [gameSlug, numericScore]);

  // Deterministic rotation: hash the current game slug to pick a stable starting
  // offset, so different games show different suggestion sets without invoking
  // Math.random during render.
  const suggestions = useMemo(() => {
    const available = ALL_SUGGESTIONS.filter((s) => !gameSlug || !s.href.includes(gameSlug));
    let h = 0;
    if (gameSlug) {
      for (let i = 0; i < gameSlug.length; i++) h = ((h << 5) - h + gameSlug.charCodeAt(i)) | 0;
    }
    const start = Math.abs(h) % Math.max(1, available.length);
    const rotated = [...available.slice(start), ...available.slice(0, start)];
    return rotated.slice(0, 4);
  }, [gameSlug]);

  const handleShare = useCallback(() => {
    if (shareData) {
      setShowShareModal(true);
      return;
    }
    const game = gameSlug ? getAllGames().find((g) => g.slug === gameSlug) : undefined;
    const gameTitle = game?.title ?? (title.replace(/[:!].*$/, "").trim() || "Daily");
    const dateKey = serverData?.dailyDate ?? getTodayDateKey();
    void shareText(
      buildShareGrid({ gameTitle, gameSlug, scoreDisplay: score, numericScore, maxScore, dateKey, practice: !isDailyFinish }),
    );
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [shareData, title, score, gameSlug, numericScore, maxScore, serverData, isDailyFinish]);

  // Inject server-side rank into the share payload so country-draft can print it.
  const enrichedShareResult = useMemo(() => {
    if (!shareData) return null;
    if (rankToday == null) return shareData.result;
    return { ...shareData.result, rank: rankToday };
  }, [shareData, rankToday]);

  return (
    <div className="flex flex-col items-center gap-0 py-6 sm:py-10">

      {/* ═══════ LAYER 1: VERDICT ═══════ */}
      <div className={`w-full rounded-2xl border p-6 sm:p-10 text-center verdict-reveal ${tier?.bgClassName ?? "bg-surface-elevated border-border"}`}>
        <div className="text-5xl sm:text-7xl font-semibold font-display text-cream score-pop tabular-nums">
          {score}
        </div>

        {tier && (
          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
            <span className={`inline-block px-4 py-1.5 text-sm font-bold rounded-full font-display ${tier.className}`}>
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
              <span className="font-semibold text-cream text-lg tabular-nums">
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
                {!hasRealData && <span className="text-xxs ml-1 opacity-50">(est.)</span>}
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
          <p className="mt-4 text-sm font-semibold text-gold-ink animate-scale-in">New personal best</p>
        )}

        {/* Brand-bracket score line: score · rank · date */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-cream-muted tabular-nums tabular-nums">
          <span>{score}</span>
          {rankToday != null && (
            <>
              <span className="text-gold">·</span>
              <span>Rank #{rankToday}</span>
            </>
          )}
          <span className="text-gold">·</span>
          <time>
            {(() => {
              const d = serverData?.dailyDate ? new Date(`${serverData.dailyDate}T00:00:00`) : new Date();
              const dd = String(d.getDate()).padStart(2, "0");
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const yy = String(d.getFullYear()).slice(2);
              return `${dd}·${mm}·${yy}`;
            })()}
          </time>
        </div>
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

      {/* Sits directly under the score, above the action row: the moment the
          player most wants their result to count is the moment they see it. */}
      {onSaveScore && isDailyFinish && (
        <div className="w-full mt-5">
          <LeaderboardJoin onJoined={onSaveScore} daily={isDailyFinish} />
        </div>
      )}

      {/* ═══════ LAYER 3: ACTIONS ═══════ */}
      <div className="w-full mt-6 grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 max-w-md mx-auto">
        {/* onSaveScore is only passed when the run finished with no session.
            It used to render a button straight into the sign-in modal; the name
            field below replaces that gate entirely. See LeaderboardJoin. */}
        {onPlayAgain && (
          <Button onClick={onPlayAgain} variant="primary" size="lg" className="sm:flex-1">
            Play again
          </Button>
        )}
        {isDailyFinish && (
          <Link
            href={`/games/${gameSlug}/play?mode=practice`}
            className="cta-primary sm:flex-1"
          >
            Play again (practice)
          </Link>
        )}
        <button onClick={handleShare} className="cta-secondary sm:flex-1">
          {shared ? "Copied!" : "Share result"}
        </button>
        {/* One-on-one duels are not part of the concept: everyone plays the same daily. */}
      </div>
      {showChallengePicker && serverData?.runId && gameSlug && (
        <ChallengeFriendPicker
          gameSlug={gameSlug}
          dailyDate={serverData.dailyDate ?? new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" })}
          runId={serverData.runId}
          onClose={() => setShowChallengePicker(false)}
        />
      )}
      {showShareModal && shareData && enrichedShareResult && (
        <ShareModal onClose={() => setShowShareModal(false)}>
          <ShareCard
            game={shareData.game}
            result={enrichedShareResult}
            dateKey={shareData.dateKey}
          />
        </ShareModal>
      )}
      {/* Daily chaining: next unplayed daily + X/total progress + live reset */}
      {isDailyFinish && chain.total > 0 && (
        <div className="w-full max-w-md mt-5 rounded-2xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-cream">
              {chain.completed}/{chain.total} dailies today
            </span>
            {resetCountdown && (
              <span className="text-cream-muted tabular-nums tabular-nums">
                Next daily in {resetCountdown}
              </span>
            )}
          </div>
          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
              style={{ width: `${Math.max((chain.completed / chain.total) * 100, 2)}%` }}
            />
          </div>
          {chain.next ? (
            <Link
              href={`${chain.next.route}/play?mode=daily`}
              className="cta-primary mt-3 w-full"
            >
              <GameMark slug={chain.next.route.replace("/games/", "")} size={18} className="mr-1" />
              Next daily: {chain.next.title}
              <span className="text-xs font-normal opacity-80">
                · {chain.remaining} left today
              </span>
              <IconArrowRight width={18} height={18} />
            </Link>
          ) : (
            <p className="mt-3 text-center text-sm text-cream-muted">
              All dailies cleared. Fresh set in {resetCountdown || "a bit"}. Nice work.
            </p>
          )}
        </div>
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
        <p className="text-xs text-cream-muted mb-3 text-center">
          More games
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
                <span className="flex justify-center mb-1.5" style={{ color: colors.text }}><GameMark slug={slug} size={26} /></span>
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
      <div className="text-xxs text-cream-muted font-medium">
        {label}
      </div>
      <div className={`text-lg font-display font-semibold tabular-nums mt-0.5 ${
        highlight === "good" ? "text-correct" : highlight === "bad" ? "text-incorrect" : ""
      }`}>
        {value}
      </div>
    </div>
  );
}

/* ---------- Share modal ---------- */

function ShareModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Share your result"
        className="relative bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-6 max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in"
      >
        {/* Grabber — native bottom-sheet affordance (mobile only) */}
        <div aria-hidden className="sm:hidden mx-auto -mt-3 mb-3 h-1.5 w-10 rounded-full bg-cream-dim" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-cream-muted/60 hover:text-cream hover:bg-cream-ghost transition-colors"
          aria-label="Close share dialog"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
        <h3 className="text-base font-extrabold text-center mb-4">Share your result</h3>
        {children}
      </div>
    </div>
  );
}
