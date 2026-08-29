import { Glyph, type GlyphProps } from "../glyph";
/** A bold plus in a rounded square, seed at the crossing. */
export function HealthIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.1]}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </Glyph>
  );
}
