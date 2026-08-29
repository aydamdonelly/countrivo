import { Glyph, type GlyphProps } from "./glyph";
export function SoundOffIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[10, 12, 1.3]}>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      <path d="M17 10l4 4M21 10l-4 4" />
    </Glyph>
  );
}
