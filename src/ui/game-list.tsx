import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHead } from "@/ui/section-head";
import { GameRow, type GameRowProps } from "@/ui/game-row";

export interface GameListProps {
  title: ReactNode;
  fact?: ReactNode;
  factHref?: string;
  live?: boolean;
  /** The last list on a phone screen: its rows dissolve into the tab bar. */
  fade?: boolean;
  rows?: readonly GameRowProps[];
  /** Extra rows composed by the page. */
  children?: ReactNode;
  headId?: string;
  className?: string;
}

/** A section head plus game rows (blueprint 3.8). */
export function GameList({ title, fact, factHref, live, fade, rows, children, headId, className }: GameListProps) {
  return (
    <section className={cn("ls", fade && "fade", className)} aria-labelledby={headId}>
      <SectionHead id={headId} title={title} fact={fact} href={factHref} live={live} />
      {rows?.map((r) => (
        <GameRow key={r.href} {...r} />
      ))}
      {children}
    </section>
  );
}
