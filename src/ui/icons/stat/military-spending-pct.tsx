import { Glyph, type GlyphProps } from "../glyph";
/** Two nested chevrons, a rank stripe, seed at the apex. */
export function MilitaryIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 13, 1.3]}>
      <path d="M5 8l7 5 7-5" />
      <path d="M5 14l7 5 7-5" />
    </Glyph>
  );
}
