import { Glyph, type GlyphProps } from "./glyph";
/** The hook that replaces the old return glyph. */
export function UndoIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.3]}>
      <path d="M16.5 15.5A6.5 6.5 0 1 1 12 5.5H7" />
      <path d="M9.5 3l-2.5 2.5L9.5 8" />
    </Glyph>
  );
}
