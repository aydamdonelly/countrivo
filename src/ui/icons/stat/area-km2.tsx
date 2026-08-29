import { Glyph, type GlyphProps } from "../glyph";
/** A square with four short corner ticks, seed at centre. */
export function AreaIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.4]}>
      <path d="M6 6h12v12H6z" />
      <path d="M6 6V3.5M6 6H3.5M18 6V3.5M18 6h2.5M6 18v2.5M6 18H3.5M18 18v2.5M18 18h2.5" />
    </Glyph>
  );
}
