import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ProseProps {
  /** Plain paragraphs, one <p> each. */
  paragraphs?: readonly string[];
  children?: ReactNode;
  className?: string;
}

/** 15/1.6 ink, paragraphs spaced 12, max-width 62ch, links underlined in faint (blueprint 3.35). */
export function Prose({ paragraphs, children, className }: ProseProps) {
  return (
    <div className={cn("prose t-prose", className)}>
      {paragraphs?.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {children}
    </div>
  );
}
