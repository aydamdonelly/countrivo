import { Glyph, type GlyphProps } from "../glyph";
/** Three building silhouettes of different heights, seed as a window. */
export function UrbanIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12.5, 8, 1.1]}>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5V10h5v10.5" />
      <path d="M9.5 20.5V4h6v16.5" />
      <path d="M15.5 20.5v-8h4v8" />
    </Glyph>
  );
}
