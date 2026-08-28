import { Glyph, type GlyphProps } from "./glyph";
export function CrownIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 13.5, 1.4]}>
      <path d="M4 17l-1-9 5 4 4-6 4 6 5-4-1 9z" />
      <path d="M5 20h14" />
    </Glyph>
  );
}
