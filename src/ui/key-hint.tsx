import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * `1 to 4 pick · Enter next` (blueprint 3.26): in the HTML always, shown only under
 * (hover: hover) and (pointer: fine) by CSS, never by JS.
 */
export function KeyHint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("keyhint t-meta", className)}>{children}</p>;
}
