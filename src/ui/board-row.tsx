import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BoardRowViewProps {
  /** null prints `–` (the me-row before the shot). */
  rank: number | null;
  /** A Flag xs (global) or a Crest 26 (friends, me). */
  identity: ReactNode;
  name: string;
  /** `<b class="t-score num">635</b>`, or a mute `no shot yet` / `not yet`. */
  score: ReactNode;
  /** The me-row treatment: card fill, margin 0 -8, radius 6, no line on top. */
  me?: boolean;
  /** A friend who has not shot: mute 500 name. */
  wait?: boolean;
  /** Rows link to the run page when a run id is known. */
  href?: string;
  prefetch?: boolean;
  className?: string;
}

/** One board row (blueprint 3.7): grid 18 26 1fr auto, gap 10, padding 7 0, 14 px, 1 px line on top. */
export function BoardRowView({ rank, identity, name, score, me, wait, href, prefetch, className }: BoardRowViewProps) {
  const cls = cn("row t-row", me && "me", wait && "wait", className);
  const inner = (
    <>
      <i className="t-meta num">{rank ?? "–"}</i>
      {identity}
      <span className="name">{name}</span>
      {score}
    </>
  );
  return href ? (
    <Link href={href} prefetch={prefetch} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** The Erode score cell. */
export function ScoreCell({ children }: { children: ReactNode }) {
  return <b className="t-score num">{children}</b>;
}
