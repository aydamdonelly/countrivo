import { Glyph, type GlyphProps } from "./glyph";
/** The only outbound and share arrow. No right-pointing CTA arrow exists. */
export function ArrowUpRightIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M7 17L17 7M9 7h8v8" />
    </Glyph>
  );
}
