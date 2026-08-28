import { Glyph, type GlyphProps } from "./glyph";
/** Marks a shot daily in lists; the seed is the keyhole. */
export function LockIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 15.5, 1.4]}>
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <rect x="5" y="11" width="14" height="9" rx="2" />
    </Glyph>
  );
}
