import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";

export interface QaItem {
  q: string;
  a: ReactNode;
  id?: string;
}

export interface QaListProps {
  items: readonly QaItem[];
  /** `all` = every answer open with h2 questions; `details` = native details per item. */
  open: "all" | "details";
  className?: string;
}

/** Questions and answers (blueprint 3.35): real <details> controls, no JS. */
export function QaList({ items, open, className }: QaListProps) {
  if (open === "all") {
    return (
      <div className={cn("qa", className)}>
        {items.map((it) => (
          <div key={it.q} id={it.id} className="item">
            <h2 className="q t-list">{it.q}</h2>
            <p className="a t-body">{it.a}</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("qa", className)}>
      {items.map((it) => (
        <details key={it.q} id={it.id}>
          <summary className="t-list">
            <span>{it.q}</span>
            <ChevronRightIcon size={18} className="chev" />
          </summary>
          <div className="a t-body">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
