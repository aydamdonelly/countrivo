import { Glyph, type GlyphProps } from "./glyph";
/** Shuffle: practice, a fresh board every time. */
export function ShuffleIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 4-2 5-4m2-2c2-3 3-4 5-4h3m-4-4 4 4-4 4" />
    </Glyph>
  );
}
