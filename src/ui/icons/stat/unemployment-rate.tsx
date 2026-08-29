import { Glyph, type GlyphProps } from "../glyph";
/** A trend line falling left to right over a short baseline, seed at the last point. */
export function UnemploymentIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[20, 15, 1.3]}>
      <path d="M4 6l5 5 4-3 7 7" />
      <path d="M4 20h16" />
    </Glyph>
  );
}
