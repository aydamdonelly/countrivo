import { NavigationLink as Link } from "@/ui/navigation-link";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import type { GameSlug, Mode } from "@/ui/types";
import { gamePresentation } from '@/content/table';
import { GameHelp } from '@/ui/game-help';
import { gameClayFrame, restFrame } from '@/ui/clay';

export interface PlayBarProps {
  slug: GameSlug;
  title: string;
  mode: Mode;
  className?: string;
}

/**
 * The play-route header (blueprint 3.18): height 56, back chevron in a 44 px hit area,
 * the game's clay object at 32 (concept 4.2, rest still), the title in Erode 18, and the
 * mode at the right. Nothing else.
 */
/** The header still (26 November 2026): the game's colour frame where one exists, like its home tile. */
function headerClay(slug: string): string {
  const game = gamePresentation(slug);
  const object = game?.clay ?? 'cl-01';
  const frame = game ? gameClayFrame(object, game.done) : { state: restFrame(object), tone: 'original' as const };
  return `/clay/${object}/${frame.tone === 'color' ? `${frame.state}-color` : frame.state}.128.webp`;
}

export function PlayBar({ slug, title, mode, className }: PlayBarProps) {
  return (
    <div className={cn("pb", className)}>
      <Link href={mode === "daily" ? "/" : "/practice"} prefetch pendingLabel="Opening your games…" aria-label="Back to games" className="back">
        <ChevronLeftIcon size={24} />
      </Link>
      <span className="clay" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized local header still */}
        <img src={headerClay(slug)} width={32} height={32} alt="" decoding="async" />
      </span>
      <h1 className="t-h3">{title}</h1>
      <span className={cn("mode t-meta", mode)}>
        {mode === "daily" ? "Daily" : "Practice"}
      </span>
      {["geo-wordle", "pinpoint", "blind-pick", "speed-flags", "capital-quiz"].includes(slug) ? <GameHelp slug={slug} title={title} /> : null}
    </div>
  );
}
