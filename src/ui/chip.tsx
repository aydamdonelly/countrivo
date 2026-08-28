import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps {
  children: ReactNode;
  className?: string;
}

/**
 * A category chip (blueprint 3.13): 11 px, padding 4 8, radius 4. Card fill on paper;
 * ink-2 fill with on-ink-chip text inside `.on-ink`. Only for the draft categories, a
 * landing card's three facts and solved Cluster traits, never for metadata or status.
 */
export function Chip({ children, className }: ChipProps) {
  return <span className={cn("chip t-kicker", className)}>{children}</span>;
}
