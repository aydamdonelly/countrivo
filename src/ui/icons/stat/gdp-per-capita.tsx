import { Glyph, type GlyphProps } from "../glyph";
/** A head above a single coin, seed in the coin. */
export function GdpPerCapitaIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 16.5, 1.3]}>
      <circle cx="12" cy="6.5" r="3" />
      <ellipse cx="12" cy="16.5" rx="6.5" ry="2.4" />
      <path d="M5.5 16.5v2.3c0 1.3 2.9 2.4 6.5 2.4s6.5-1.1 6.5-2.4v-2.3" />
    </Glyph>
  );
}
