import { Glyph, type GlyphProps } from "../glyph";
/** An adult beside a smaller child, seed in the adult's head. */
export function FertilityIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[7.5, 6, 1.3]}>
      <circle cx="7.5" cy="6" r="3" />
      <path d="M2.5 21v-5a5 5 0 0 1 10 0v5" />
      <circle cx="17.5" cy="12" r="2.5" />
      <path d="M14 21v-1a3.5 3.5 0 0 1 7 0v1" />
    </Glyph>
  );
}
