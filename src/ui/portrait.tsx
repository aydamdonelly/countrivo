import type { CSSProperties } from "react";

export interface PortraitProps {
  /** figures.json slug; the file is public/figures/{slug}.jpg when we have a free image. */
  slug: string;
  /** Used for the fallback monogram and the alt text. */
  name: string;
  /** True when a freely licensed portrait exists for this person. */
  has: boolean;
  size?: number;
  className?: string;
}

/**
 * A person on the draft board. Where a freely licensed portrait exists we show the real
 * one; where it does not we draw our own monogram rather than inventing a likeness (the
 * competitor ships one generic illustration for several different people, with a
 * disclaimer under each). Credits live on /credits.
 */
export function Portrait({ slug, name, has, size = 44, className }: PortraitProps) {
  const style: CSSProperties = { width: size, height: size, fontSize: size };
  const initial = name.trim().charAt(0).toUpperCase();
  return has ? (
    // eslint-disable-next-line @next/next/no-img-element -- one static square, no layout shift, no loader wanted
    <img
      src={`/figures/${slug}.jpg`}
      alt=""
      width={size}
      height={size}
      loading="eager"
      decoding="sync"
      className={className ? `fig ${className}` : "fig"}
      style={style}
    />
  ) : (
    <span aria-hidden="true" className={className ? `fig fig-none ${className}` : "fig fig-none"} style={style}>
      <span className="t-num num">{initial}</span>
    </span>
  );
}
