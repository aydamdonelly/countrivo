import { Glyph, type GlyphProps } from "./glyph";
export function BoltIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[11.5, 12.5, 1.3]}>
      <path d="M13 3L5 13h6l-1 8 9-11h-6l1-7z" />
    </Glyph>
  );
}
