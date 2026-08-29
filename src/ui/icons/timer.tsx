import { Glyph, type GlyphProps } from "./glyph";
export function TimerIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 13, 1.4]}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 3v3" />
      <path d="M9 3h6" />
    </Glyph>
  );
}
