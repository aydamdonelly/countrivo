import { Glyph, type GlyphProps } from "../glyph";
/** A triangular tree with a trunk, seed at the trunk top. */
export function ForestIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 16.5, 1.3]}>
      <path d="M12 3l5 7.5h-3l4 6H6l4-6H7z" />
      <path d="M12 16.5V21" />
    </Glyph>
  );
}
