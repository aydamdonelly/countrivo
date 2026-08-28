import { Glyph, type GlyphProps } from "./glyph";
export function PinIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 10, 1.5]}>
      <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" />
    </Glyph>
  );
}
