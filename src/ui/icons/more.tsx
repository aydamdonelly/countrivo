import { Glyph, type GlyphProps } from "./glyph";
/** Player options on a leaderboard row: three quiet dots. */
export function MoreIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="5" cy="12" r="0.9" />
      <circle cx="12" cy="12" r="0.9" />
      <circle cx="19" cy="12" r="0.9" />
    </Glyph>
  );
}
