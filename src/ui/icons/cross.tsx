import { Glyph, type GlyphProps } from "./glyph";
export function CrossIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.3]}>
      <path d="M7 7l10 10M17 7L7 17" />
    </Glyph>
  );
}
