import { Glyph, type GlyphProps } from "./glyph";
export function PlayIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[10.5, 12, 1.2]}>
      <path d="M8 5.5v13l10-6.5z" />
    </Glyph>
  );
}
