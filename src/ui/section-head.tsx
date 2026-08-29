import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SectionHeadProps {
  title: ReactNode;
  /** Facts joined by ` · `: `6 games · 0 shot`. */
  fact?: ReactNode;
  /** A live fact about people (`41 shots`, `3 of 5 have shot`, `you're #2`): ember 600. */
  live?: boolean;
  /** Makes the fact a link (mute). */
  href?: string;
  /** `list` margin 4 0 2; `strip` margin 0 0 10 (strips and boards). */
  variant?: "list" | "strip";
  id?: string;
  className?: string;
}

/** `<h3>` 12 px 500 mute, flex space-between, title left, fact right (blueprint 3.9). Never uppercase, no rule beside it. */
export function SectionHead({ title, fact, live, href, variant = "list", id, className }: SectionHeadProps) {
  const factCls = cn("fact", live && "live");
  return (
    <h3 id={id} className={cn("sh t-meta", variant === "strip" && "strip", className)}>
      <span>{title}</span>
      {fact == null ? null : href ? (
        <Link href={href} className={factCls}>
          {fact}
        </Link>
      ) : (
        <span className={factCls}>{fact}</span>
      )}
    </h3>
  );
}
