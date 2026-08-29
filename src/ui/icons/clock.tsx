import { Glyph, type GlyphProps } from "./glyph";
export function ClockIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.4]}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}
