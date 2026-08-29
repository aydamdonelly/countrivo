import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Mark } from "@/ui/mark";
import { Flag } from "@/ui/flag";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import type { GameSlug } from "@/ui/types";

export interface GameRowProps {
  /** Draws the game's mark as the lead unless `lead` is given. */
  slug?: GameSlug;
  title: string;
  /** Server-computed meta (blueprint 10.4). */
  meta: string;
  href: string;
  tag?: "NEW";
  /** An action word at the right instead of the chevron (`Shoot`). */
  action?: string;
  /** A custom lead (a Flag, a StatIcon, an Icon) in the 42 px slot. */
  lead?: ReactNode;
  /** Small flags before the chevron (the rankings hub's top 3). */
  flags?: readonly string[];
  prefetch?: boolean;
  className?: string;
}

/**
 * K3 `listK` row (blueprint 3.8): flex gap 12, padding 12 0, 16 px title, 1 px line on
 * top, mark in a 42 px centred slot, meta under the title, chevron faint or an action
 * word. No hover background; pressed = title mute for 120 ms.
 */
export function GameRow({ slug, title, meta, href, tag, action, lead, flags, prefetch, className }: GameRowProps) {
  return (
    <Link href={href} prefetch={prefetch} className={cn("row t-list", className)}>
      <span className="lead">{lead ?? (slug ? <Mark slug={slug} size={26} /> : null)}</span>
      <span className="body">
        <span className="title">{title}</span>
        {tag ? <em className="t-kicker">{tag}</em> : null}
        <small className="t-meta">{meta}</small>
      </span>
      {flags && flags.length > 0 ? (
        <span className="flags">
          {flags.map((f) => (
            <Flag key={f} iso2={f} size="xs" alt="" />
          ))}
        </span>
      ) : null}
      {action ? <span className="act t-meta">{action}</span> : <ChevronRightIcon size={18} className="chev" />}
    </Link>
  );
}
