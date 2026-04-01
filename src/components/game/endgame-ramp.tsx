"use client";

interface EndgameRampProps {
  picksRemaining: number;
  totalPicks: number;
}

export function EndgameRamp({ picksRemaining, totalPicks }: EndgameRampProps) {
  if (picksRemaining > 2 || picksRemaining <= 0 || totalPicks <= 2) return null;

  const isFinal = picksRemaining === 1;

  return (
    <div
      className={`text-center py-2 px-4 rounded-xl text-sm font-bold transition-all duration-500 ${
        isFinal
          ? "endgame-glow bg-gold-dim text-gold border border-gold/20"
          : "bg-surface-elevated text-cream-muted border border-border"
      }`}
    >
      {isFinal ? (
        <span>Final pick — this decides your run</span>
      ) : (
        <span>2 picks left — choose carefully</span>
      )}
    </div>
  );
}
