import { Glyph, type GlyphProps } from "./glyph";
export function SearchIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[10.5, 10.5, 1.4]}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </Glyph>
  );
}
