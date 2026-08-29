import { Glyph, type GlyphProps } from "../glyph";
/** A single leaf with a mid vein, seed at the vein base. */
export function RenewableIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[6.2, 19.6, 1.3]}>
      <path d="M20 4c-9 0-15 5-15 13 0 1.6.3 2.8.8 3.5C7.5 20 9 20 11 20c7 0 9-8 9-16z" />
      <path d="M5.8 20.5C8 15 11 11 16 8" />
    </Glyph>
  );
}
