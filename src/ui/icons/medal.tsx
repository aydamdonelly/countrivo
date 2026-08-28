import { Glyph, type GlyphProps } from "./glyph";
export function MedalIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 14, 1.6]}>
      <circle cx="12" cy="14" r="5.5" />
      <path d="M9 9.5 7 3h4l1 3 1-3h4l-2 6.5" />
    </Glyph>
  );
}
