import { Glyph, type GlyphProps } from "./glyph";
export function UserIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 8, 1.3]}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Glyph>
  );
}
