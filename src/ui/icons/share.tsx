import { Glyph, type GlyphProps } from "./glyph";
/** Share: a box with an arrow leaving it upwards. Every share action uses it. */
export function ShareIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M7 10H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </Glyph>
  );
}
