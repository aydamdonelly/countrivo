import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Fact {
  /** Erode 22. */
  value: ReactNode;
  label: ReactNode;
  /** A third mute line (the formatted stat under a rank). */
  sub?: ReactNode;
  href?: string;
}

export interface FactRowProps {
  /** 2 to 4 tiles. */
  facts: readonly Fact[];
  className?: string;
}

/**
 * One row of fact tiles (blueprint 3.35), at most ONE per page: card fill, radius 12,
 * padding 14 14 12, value in Erode 22, label mute. Linked tiles fill line on hover.
 * No icon in a tile.
 */
export function FactRow({ facts, className }: FactRowProps) {
  return (
    <div className={cn("facts", className)} data-n={facts.length}>
      {facts.map((f, i) => {
        const inner = (
          <>
            <b className="v t-score-l num">{f.value}</b>
            <span className="l t-meta">{f.label}</span>
            {f.sub ? <span className="s t-meta">{f.sub}</span> : null}
          </>
        );
        return f.href ? (
          <Link key={i} href={f.href} className="f">
            {inner}
          </Link>
        ) : (
          <div key={i} className="f">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
