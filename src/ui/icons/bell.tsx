import { Glyph, type GlyphProps } from "./glyph";
export function BellIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Glyph>
  );
}
