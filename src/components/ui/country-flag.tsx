/**
 * A real flag (SVG from /public/flags) instead of an emoji, which renders as
 * two letters on Windows and differs per platform everywhere else.
 */
export function CountryFlag({ iso2, name, width = 26, className = "" }: { iso2: string; name?: string; width?: number; className?: string }) {
  const h = Math.round(width * 0.7);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${iso2.toLowerCase()}.svg`}
      alt={name ? `Flag of ${name}` : ""}
      width={width}
      height={h}
      loading="lazy"
      decoding="async"
      className={`inline-block rounded-[3px] object-cover shrink-0 ${className}`}
      style={{ width, height: h }}
    />
  );
}
