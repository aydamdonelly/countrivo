import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The 4x4 Cluster grid (gap 6) or a 2x2 quiz grid; tiles keep `aspect-ratio: 1`. */
export function TileGrid({ children, columns = 4, className }: { children: ReactNode; columns?: 2 | 4; className?: string }) {
  return (
    <div className={cn("tile-grid", className)} style={columns === 2 ? { gridTemplateColumns: "1fr 1fr" } : undefined}>
      {children}
    </div>
  );
}
