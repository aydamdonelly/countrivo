import { Glyph, type GlyphProps } from "../glyph";
/** A heart, seed at its centre. */
export function LifeExpectancyIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12.5, 1.4]}>
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.3c0 5.6-7.5 10.2-7.5 10.2z" />
    </Glyph>
  );
}
