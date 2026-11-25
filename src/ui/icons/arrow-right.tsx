import { Glyph, type GlyphProps } from "./glyph";
/** Only inside the round paper button of the ink next-game card. */
export function ArrowRightIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Glyph>
  );
}
