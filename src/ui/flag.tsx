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
  /**
   * ISO 3166-1 alpha-2, any case. A flag is a real country or it is not drawn:
   * `null` renders nothing at all, so no surface can print an empty box. A person
   * without a country wears the seed `Crest` instead (blueprint 5.2).
   */
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
 * Locally rendered clay relief from the original national artwork. Contain
 * sizing preserves every emblem when a game supplies a different box ratio.
 */
export function Flag({ iso2, size = "xs", alt, className, eager }: FlagProps) {
  if (!iso2) return null;
  const { w, h } = FLAG_SIZES[size];
  const code = iso2.toLowerCase();
  return (
    <span className={className ? `flag ${className}` : "flag"} data-compact={w <= 32 || undefined} style={{ width: w, height: h }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized local material renders */}
      <img src={`/clay-flags/${code}.webp`} srcSet={`/clay-flags/${code}.96.webp 96w, /clay-flags/${code}.240.webp 240w, /clay-flags/${code}.webp 640w`} sizes={`${w}px`} width={w} height={h} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
    </span>
  );
}
