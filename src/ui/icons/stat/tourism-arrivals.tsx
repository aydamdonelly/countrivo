import { Glyph, type GlyphProps } from "../glyph";
/** A plane in a 45 degree climb, seed at the nose. */
export function TourismIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[19, 5, 1.4]}>
      <path d="M5 19L19 5" />
      <path d="M13 11l-6.5-3.5 2.5-2.5 8 2" />
      <path d="M13 11l3.5 6.5-2.5 2.5-2-8" />
      <path d="M6.5 17.5l-2.5 1" />
    </Glyph>
  );
}
