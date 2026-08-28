import { Glyph, type GlyphProps } from "../glyph";
/** A cup with a handle and one steam curl, seed in the cup. */
export function CoffeeIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[10.5, 14, 1.2]}>
      <path d="M5 9h11v5.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
      <path d="M10.5 3.5c-1.5 1.5 1.5 2.5 0 4" />
    </Glyph>
  );
}
