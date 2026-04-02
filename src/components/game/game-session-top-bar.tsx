"use client";

interface GameSessionTopBarProps {
  mode: "daily" | "practice";
  scoreLabel: string;
  scoreValue: string;
  progressCurrent: number;
  progressTotal: number;
  extraInfo?: string;
}

export function GameSessionTopBar({
  mode,
  scoreLabel,
  scoreValue,
  progressCurrent,
  progressTotal,
  extraInfo,
}: GameSessionTopBarProps) {
  const pct = progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border">
      {/* Mode badge */}
      <span
        className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
          mode === "daily"
            ? "bg-gold text-white"
            : "bg-black/5 text-cream-muted"
        }`}
      >
        {mode === "daily" ? "Daily" : "Practice"}
      </span>

      {/* Progress bar */}
      <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Score */}
      <div className="shrink-0 text-right" aria-live="polite" aria-atomic="true">
        <span className="text-[10px] text-cream-muted uppercase tracking-wide">{scoreLabel}</span>
        <span className="ml-1.5 text-sm font-extrabold font-mono text-cream">{scoreValue}</span>
      </div>

      {/* Extra info */}
      {extraInfo && (
        <>
          <div className="w-px h-5 bg-border shrink-0" />
          <span className="shrink-0 text-xs text-cream-muted font-medium">{extraInfo}</span>
        </>
      )}

      {/* Progress fraction */}
      <div className="w-px h-5 bg-border shrink-0" />
      <span className="shrink-0 text-sm font-bold text-cream-muted tabular-nums">
        {progressCurrent}/{progressTotal}
      </span>
    </div>
  );
}
