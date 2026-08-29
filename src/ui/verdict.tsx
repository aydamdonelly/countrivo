import { cn } from "@/lib/utils";

export type VerdictTone = "good" | "neutral" | "bad";

export interface VerdictProps {
  tone?: VerdictTone | null;
  /** `Rank 4. Great pick.` Empty keeps the 20 px line. */
  text?: string;
  /** `+118`, mute. */
  delta?: string;
  /** Plays the 4 px slide when the text changes. */
  animate?: boolean;
  className?: string;
}

/**
 * The feedback line (blueprint 3.23): always rendered, min-height 20, role status.
 * Good ink 600, neutral mute 500, bad ember 600, the delta mute 400. No pill, no icon.
 */
export function Verdict({ tone, text, delta, animate, className }: VerdictProps) {
  return (
    <p className={cn("verdict t-body", tone ?? undefined, className)} role="status" aria-live="polite">
      {text ? (
        <span key={`${text}${delta ?? ""}`} className={animate ? "verdict-in" : undefined} style={{ display: "inline-block" }}>
          {text}
          {delta ? <span className="delta num">{delta}</span> : null}
        </span>
      ) : null}
    </p>
  );
}
