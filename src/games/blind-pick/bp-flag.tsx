/**
 * A flag at a size the shared Flag primitive does not carry: 64 x 43 on the arriving country
 * card (concept 3.10, Country card) and 20 x 15 inside a placed slot (concept BP1). Same
 * markup as `@/ui/flag`, so it wears the same radius and inset edge ring.
 */
export function BpFlag({ iso2, w, h, alt, className }: { iso2: string; w: number; h: number; alt: string; className?: string }) {
  return (
    <span className={className ? `flag ${className}` : "flag"} style={{ width: w, height: h }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG assets, no optimisation wanted */}
      <img src={`/flags/${iso2.toLowerCase()}.svg`} width={w} height={h} alt={alt} loading="eager" decoding="async" />
    </span>
  );
}
