import { Glyph, type GlyphProps } from "./glyph";
export function CloseIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  );
}
