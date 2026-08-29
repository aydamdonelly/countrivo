export type FlagSize = "xs" | "s" | "m" | "l" | "xl" | "hero";

/** 4:3 boxes (blueprint 3.15). */
export const FLAG_SIZES: Record<FlagSize, { w: number; h: number }> = {
  xs: { w: 24, h: 18 },
  s: { w: 32, h: 24 },
  m: { w: 48, h: 36 },
  l: { w: 80, h: 60 },
  xl: { w: 104, h: 78 },
  hero: { w: 120, h: 90 },
};

export interface FlagProps {
  /** ISO 3166-1 alpha-2, any case; null draws a wait-filled box (a row without a country). */
  iso2: string | null;
  size?: FlagSize;
  /**
   * The country name when the flag is information; "" when the name sits beside it or
   * when naming it would leak an answer.
   */
  alt: string;
  className?: string;
  /** Flags above the fold may opt out of lazy loading. */
  eager?: boolean;
}

/**
 * A real flag from /public/flags (the flag-icons 4x3 set), 3 px radius, with the
 * 1 px inset ring that keeps white-heavy flags legible on paper. Never an emoji.
 */
export function Flag({ iso2, size = "xs", alt, className, eager }: FlagProps) {
  const { w, h } = FLAG_SIZES[size];
  const code = iso2 ? iso2.toLowerCase() : null;
  return (
    <span className={className ? `flag ${className}` : "flag"} style={{ width: w, height: h }} role={code ? undefined : "img"} aria-label={code ? undefined : alt || "no flag"}>
      {code ? (
        // eslint-disable-next-line @next/next/no-img-element -- static SVG assets, no optimisation wanted
        <img src={`/flags/${code}.svg`} width={w} height={h} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : null}
    </span>
  );
}
