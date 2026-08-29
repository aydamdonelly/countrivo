import { Glyph, type GlyphProps } from "../glyph";
/** Two heads side by side, seed in the front head. */
export function PopulationIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[9, 8, 1.3]}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="7.5" r="2.5" />
      <path d="M15.2 13.4a4.5 4.5 0 0 1 5.8 4.1" />
    </Glyph>
  );
}
