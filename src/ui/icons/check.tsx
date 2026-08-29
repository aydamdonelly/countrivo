import { Glyph, type GlyphProps } from "./glyph";
export function CheckIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[9.5, 17, 1.3]}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Glyph>
  );
}
