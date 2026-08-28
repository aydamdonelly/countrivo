import { Glyph, type GlyphProps } from "./glyph";
export function SoundIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[10, 12, 1.3]}>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      <path d="M17 9a4.5 4.5 0 0 1 0 6" />
    </Glyph>
  );
}
