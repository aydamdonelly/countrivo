"use client";

interface Side {
  name: string;
  score: string;
}

interface DuelResultCardProps {
  you: Side;
  opponent: Side;
  outcome: "win" | "lose" | "draw";
  onShare?: () => void;
}

const BANNER: Record<DuelResultCardProps["outcome"], { text: string; cls: string }> = {
  win: { text: "You win", cls: "text-correct" },
  lose: { text: "You lose", cls: "text-incorrect" },
  draw: { text: "Draw", cls: "text-gold-ink" },
};

/** Head-to-head duel outcome (winner by score_sort_value, computed server-side). */
export function DuelResultCard({ you, opponent, outcome, onShare }: DuelResultCardProps) {
  const banner = BANNER[outcome];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xl" aria-hidden>⚔️</span>
        <span className={`font-display text-lg font-extrabold ${banner.cls}`}>{banner.text}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className={outcome === "lose" ? "opacity-60" : ""}>
          <div className="text-xxs label-caps text-cream-muted mb-1">You</div>
          <div className="font-display text-3xl font-extrabold tabular-nums text-gold">{you.score}</div>
        </div>
        <div className="text-cream-dim text-sm font-bold">VS</div>
        <div className={outcome === "win" ? "opacity-60" : ""}>
          <div className="text-xxs label-caps text-cream-muted mb-1 truncate">{opponent.name}</div>
          <div className="font-display text-3xl font-extrabold tabular-nums">{opponent.score}</div>
        </div>
      </div>
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          className="mt-5 w-full min-h-12 rounded-xl bg-gold text-white font-bold active:scale-[0.98] transition-transform"
        >
          Share result
        </button>
      )}
    </div>
  );
}
