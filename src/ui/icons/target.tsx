import { Glyph, type GlyphProps } from "./glyph";
export function TargetIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.6]}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </Glyph>
  );
}
