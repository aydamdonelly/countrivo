import { Glyph, type GlyphProps } from "../glyph";
/** A stemmed glass, seed in the bowl. */
export function WineIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 8.5, 1.4]}>
      <path d="M7.5 3.5h9l-.8 6.5a3.8 3.8 0 0 1-7.4 0z" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </Glyph>
  );
}
