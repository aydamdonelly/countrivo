import { Glyph, type GlyphProps } from "./glyph";
/** Calendar: the archive of past days. */
export function CalendarIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 2v6m8-6v6M4 11h16" />
    </Glyph>
  );
}
