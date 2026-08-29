import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EditorialHeadProps {
  title: ReactNode;
  lead?: ReactNode;
  fact?: ReactNode;
  id?: string;
  className?: string;
}

/** `<h2 class="t-h2">` with an optional mute lead and a baseline-aligned fact (blueprint 3.35). */
export function EditorialHead({ title, lead, fact, id, className }: EditorialHeadProps) {
  return (
    <div className={cn("eh", className)}>
      <div>
        <h2 id={id} className="t-h2">
          {title}
        </h2>
        {lead ? <p className="lead t-row">{lead}</p> : null}
      </div>
      {fact ? <span className="fact t-meta">{fact}</span> : null}
    </div>
  );
}
