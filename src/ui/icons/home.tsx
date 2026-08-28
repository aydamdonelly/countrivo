import { Glyph, type GlyphProps } from "./glyph";
export function HomeIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 9, 1.4]}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </Glyph>
  );
}
