"use client";

export type HomeMode = "daily" | "practice";

const HELP: Record<HomeMode, string> = {
  daily: "One shot per game, same board for everyone, 24 h.",
  practice: "Random boards, unlimited, nothing counts.",
};

export function ModeSwitch({ mode, onChange }: { mode: HomeMode; onChange: (m: HomeMode) => void }) {
  return (
    <div className="mb-4">
      <div
        role="tablist"
        aria-label="Mode"
        className="relative flex h-11 rounded-xl bg-surface-elevated p-1"
      >
        <span
          aria-hidden
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[9px] bg-cream transition-transform duration-300 ease-[var(--ease-emphasis)]"
          style={{ transform: mode === "practice" ? "translateX(calc(100% + 0px))" : "translateX(0)" , left: 4 }}
        />
        {(["daily", "practice"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => onChange(m)}
            className={`relative z-10 flex-1 text-sm transition-colors duration-200 ${mode === m ? "text-bg font-semibold" : "text-cream-muted font-medium"}`}
          >
            {m === "daily" ? "Daily" : "Practice"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-cream-muted" aria-live="polite">{HELP[mode]}</p>
    </div>
  );
}
