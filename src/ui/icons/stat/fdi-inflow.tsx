import { Glyph, type GlyphProps } from "../glyph";
/** An arrow entering an open box from the top right, seed at the arrow tip. */
export function FdiIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.3]}>
      <path d="M4 11v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
      <path d="M19 5l-7 7" />
      <path d="M12 7v5h5" />
    </Glyph>
  );
}
