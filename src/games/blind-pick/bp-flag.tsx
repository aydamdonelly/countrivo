/**
 * A flag at a size the shared Flag primitive does not carry: 64 x 43 on the arriving country
 * card (concept 3.10, Country card) and 20 x 15 inside a placed slot (concept BP1). Same
 * markup as `@/ui/flag`, with the same locally rendered clay material.
 */
export function BpFlag({ iso2, w, h, alt, className }: { iso2: string; w: number; h: number; alt: string; className?: string }) {
  return (
    <span className={className ? `flag ${className}` : "flag"} data-compact={w <= 32 || undefined} style={{ width: w, height: h }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized local material renders */}
      <img src={`/clay-flags/${iso2.toLowerCase()}.webp`} srcSet={`/clay-flags/${iso2.toLowerCase()}.96.webp 96w, /clay-flags/${iso2.toLowerCase()}.240.webp 240w, /clay-flags/${iso2.toLowerCase()}.webp 640w`} sizes={`${w}px`} width={w} height={h} alt={alt} loading="eager" decoding="async" />
    </span>
  );
}
