import { Glyph, type GlyphProps } from "./glyph";
export function GlobeIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.6]}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" />
    </Glyph>
  );
}
