import { Glyph, type GlyphProps } from "../glyph";
/** A stack of three coin ovals, seed in the top one. */
export function GdpIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 7, 1.2]}>
      <ellipse cx="12" cy="7" rx="7" ry="2.8" />
      <path d="M5 7v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V7" />
      <path d="M5 11v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4" />
      <path d="M5 15v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4" />
    </Glyph>
  );
}
