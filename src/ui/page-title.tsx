import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageTitleProps {
  title: ReactNode;
  /** A Flag xl or a StatIcon 32: above the title on phones, left of it on desktop. */
  eyebrow?: ReactNode;
  /** One mute line, facts joined by middle dots. */
  meta?: ReactNode;
  /** A mute fact, right-aligned on desktop. */
  fact?: ReactNode;
  className?: string;
}

/** The page h1 block (blueprint 3.35): no kicker above it, no rule under it, margin-bottom 24. */
export function PageTitle({ title, eyebrow, meta, fact, className }: PageTitleProps) {
  return (
    <header className={cn("pt", className)}>
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <div className="pt-main">
        <h1 className="t-h1">{title}</h1>
        {meta ? <p className="meta t-row">{meta}</p> : null}
      </div>
      {fact ? <p className="fact t-meta">{fact}</p> : null}
    </header>
  );
}
