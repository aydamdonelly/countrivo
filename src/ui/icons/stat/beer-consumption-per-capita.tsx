import { Glyph, type GlyphProps } from "../glyph";
/** A mug with a handle and a foam line, seed in the foam. */
export function BeerIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[11, 8.5, 1.2]}>
      <path d="M6 6h10v14H6z" />
      <path d="M16 10h2.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M6 9.5c1.5-1 3-1 5 0s3.5 1 5 0" />
    </Glyph>
  );
}
