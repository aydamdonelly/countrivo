import { Glyph, type GlyphProps } from "../glyph";
/** A sprout with two leaves, seed at the base. */
export function FertilityIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 19.5, 1.3]}>
      <path d="M12 21V11" />
      <path d="M12 14c-4 0-6.5-2.5-6.5-6.5 4 0 6.5 2.5 6.5 6.5z" />
      <path d="M12 11c4 0 6.5-2.5 6.5-6.5-4 0-6.5 2.5-6.5 6.5z" />
    </Glyph>
  );
}
