import { Glyph, type GlyphProps } from "./glyph";
export function TrophyIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 8, 1.6]}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4" />
      <path d="M12 14v3" />
      <path d="M8 20h8" />
    </Glyph>
  );
}
