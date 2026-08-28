import { Glyph, type GlyphProps } from "../glyph";
/** A mortarboard with a tassel, seed at the button. */
export function EducationIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 9, 1.2]}>
      <path d="M2.5 9L12 4l9.5 5L12 14z" />
      <path d="M6 11.2V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.8" />
      <path d="M21.5 9v5" />
    </Glyph>
  );
}
