import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Flame } from "@/ui/flame";

export interface NudgeProps {
  children: ReactNode;
  /** The ember action word at the right. */
  action?: { label: string; href: string; prefetch?: boolean };
  className?: string;
}

/** Flame 18, card fill, radius 10, padding 12 14 (blueprint 3.11). */
export function Nudge({ children, action, className }: NudgeProps) {
  return (
    <section className={cn("nd t-body", className)}>
      <Flame size={18} />
      <span>{children}</span>
      {action ? (
        <Link href={action.href} prefetch={action.prefetch}>
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
