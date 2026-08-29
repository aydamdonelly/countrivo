import Link from "next/link";
import { cn } from "@/lib/utils";
import { Mark } from "@/ui/mark";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import type { GameSlug, Mode } from "@/ui/types";

export interface PlayBarProps {
  slug: GameSlug;
  title: string;
  mode: Mode;
  className?: string;
}

/**
 * The play-route header (blueprint 3.18): height 56, back chevron in a 44 px hit area,
 * Mark 22, the title in Erode 18, and the mode at the right. Nothing else.
 */
export function PlayBar({ slug, title, mode, className }: PlayBarProps) {
  return (
    <div className={cn("pb", className)}>
      <Link href={`/games/${slug}`} aria-label={`Back to ${title}`} className="back">
        <ChevronLeftIcon size={24} />
      </Link>
      <Mark slug={slug} size={22} />
      <h1 className="t-h3">{title}</h1>
      <span className={cn("mode t-meta", mode)}>{mode === "daily" ? "Daily · one shot" : "Practice · doesn't count"}</span>
    </div>
  );
}
