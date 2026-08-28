import { Glyph, type GlyphProps } from "../glyph";
/** A trend line rising, seed at the last point. */
export function InflationIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[20, 9, 1.3]}>
      <path d="M4 18l5-5 4 3 7-7" />
    </Glyph>
  );
}
