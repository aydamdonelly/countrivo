import { Glyph, type GlyphProps } from "./glyph";
export function HashIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.3]}>
      <path d="M9 4l-2 16M17 4l-2 16M4 9h16M4 15h16" />
    </Glyph>
  );
}
