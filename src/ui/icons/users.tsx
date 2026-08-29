import { Glyph, type GlyphProps } from "./glyph";
export function UsersIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[9, 8, 1.2]}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15 5.5a3 3 0 0 1 0 5" />
      <path d="M17.5 13.8A5 5 0 0 1 21 19" />
    </Glyph>
  );
}
