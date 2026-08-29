import { Glyph, type GlyphProps } from "./glyph";
export function ArrowUpIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </Glyph>
  );
}
