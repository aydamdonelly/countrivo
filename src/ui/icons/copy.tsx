import { Glyph, type GlyphProps } from "./glyph";
export function CopyIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[14.5, 14.5, 1.3]}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M4 15V6a2 2 0 0 1 2-2h9" />
    </Glyph>
  );
}
