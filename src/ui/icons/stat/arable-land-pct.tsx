import { Glyph, type GlyphProps } from "../glyph";
/** A wheat ear: stem with three pairs of grains, seed at the top grain. */
export function ArableIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 5.5, 1.3]}>
      <path d="M12 21V8" />
      <path d="M12 9l-3-2.5M12 9l3-2.5M12 12.5l-3-2.5M12 12.5l3-2.5M12 16l-3-2.5M12 16l3-2.5" />
    </Glyph>
  );
}
