import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";

export interface FoundItem {
  iso2: string;
  name: string;
  /** Found (check) or missed (cross, mute name). */
  ok: boolean;
  /** A trailing value (`1.2 s`, `missed`). */
  value?: string;
}

/** Found items as Flag xs + name rows with a check, misses with a cross (blueprint 8.7). */
export function FoundList({ items, scroll, className }: { items: readonly FoundItem[]; scroll?: boolean; className?: string }) {
  return (
    <div className={cn("found t-row", scroll && "rscroll", className)}>
      {items.map((it, i) => (
        <div key={`${it.iso2}-${i}`} className={cn("frow", !it.ok && "miss")}>
          <Flag iso2={it.iso2} size="xs" alt="" />
          <span className="nm">{it.name}</span>
          {it.value ? <span className={cn("t-meta", !it.ok && "bad")}>{it.value}</span> : null}
          {it.ok ? <CheckIcon size={16} className="ic-ok" /> : <CrossIcon size={16} className="ic-miss" />}
        </div>
      ))}
    </div>
  );
}
