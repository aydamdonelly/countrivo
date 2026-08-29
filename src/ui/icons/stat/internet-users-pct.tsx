import { Glyph, type GlyphProps } from "../glyph";
/** Three concentric quarter arcs from the bottom-left corner, seed at the origin. */
export function InternetIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[5, 19, 1.5]}>
      <path d="M5 14a5 5 0 0 1 5 5" />
      <path d="M5 9.5a9.5 9.5 0 0 1 9.5 9.5" />
      <path d="M5 5a14 14 0 0 1 14 14" />
    </Glyph>
  );
}
